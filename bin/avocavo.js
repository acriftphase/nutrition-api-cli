#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { NutritionAPI } = require('../lib/api');
const { AuthManager } = require('../lib/auth');
const { formatNutrition, formatTable } = require('../lib/formatters');
const { version } = require('../package.json');

// Initialize auth manager
const auth = new AuthManager();

program
  .name('avocavo')
  .description('Avocavo Nutrition API CLI - Fast, accurate nutrition data with USDA verification')
  .version(version);

// Global options
program
  .option('-k, --api-key <key>', 'API key (overrides stored credentials)')
  .option('--base-url <url>', 'API base URL', 'https://app.avocavo.app')
  .option('--json', 'Output raw JSON')
  .option('--verbose', 'Verbose output');

// Login command
program
  .command('login')
  .description('Login to Avocavo using OAuth (Google/GitHub)')
  .option('-p, --provider <provider>', 'OAuth provider (google or github)', 'google')
  .action(async (options) => {
    try {
      const success = await auth.login(options.provider);
      if (success) {
        console.log(chalk.green('✅ Successfully logged in!'));
        
        // Test the API key
        const apiKey = auth.getApiKey();
        if (apiKey) {
          const api = new NutritionAPI(apiKey, program.opts().baseUrl);
          try {
            const account = await api.getAccountUsage();
            console.log(chalk.cyan(`📊 Account: ${account.email} (${account.api_tier} tier)`));
            console.log(chalk.cyan(`📈 Usage: ${account.usage.current_month}/${account.usage.monthly_limit || 'unlimited'}`));
          } catch (err) {
            console.log(chalk.yellow('⚠️  Login successful but couldn\'t fetch account info'));
          }
        }
      } else {
        console.log(chalk.red('❌ Login failed'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Login error: ${error.message}`));
      process.exit(1);
    }
  });

// Logout command
program
  .command('logout')
  .description('Logout and remove stored credentials')
  .action(() => {
    try {
      auth.logout();
      console.log(chalk.green('✅ Successfully logged out'));
    } catch (error) {
      console.error(chalk.red(`❌ Logout error: ${error.message}`));
      process.exit(1);
    }
  });

// Keys management command
program
  .command('keys')
  .description('Manage API keys')
  .option('-l, --list', 'List all stored API keys')
  .option('-s, --switch <keyId>', 'Switch to a different API key')
  .option('-a, --add <apiKey>', 'Add an API key manually')
  .option('-n, --nickname <name>', 'Nickname for manually added key')
  .option('-r, --remove <keyId>', 'Remove an API key')
  .option('--validate [keyId]', 'Validate API key (current active key if none specified)')
  .action(async (options) => {
    try {
      // List all keys
      if (options.list) {
        const keys = auth.getAllKeys();
        const activeKeyId = auth.getActiveKeyId();
        
        if (Object.keys(keys).length === 0) {
          console.log(chalk.yellow('⚠️  No API keys stored'));
          console.log(chalk.cyan('💡 Run: avocavo login or avocavo keys --add <key>'));
          return;
        }
        
        console.log(chalk.bold('🔑 Stored API Keys:'));
        console.log('');
        
        for (const [keyId, keyData] of Object.entries(keys)) {
          const isActive = keyId === activeKeyId;
          const activeIndicator = isActive ? chalk.green('● ACTIVE') : chalk.gray('○');
          
          console.log(`${activeIndicator} ${chalk.cyan(keyData.nickname)}`);
          console.log(`  📝 ID: ${chalk.gray(keyId)}`);
          console.log(`  🔑 Key: ${chalk.gray(keyData.key.substring(0, 12))}...`);
          console.log(`  🌐 Provider: ${chalk.gray(keyData.provider)}`);
          if (keyData.userInfo?.email) {
            console.log(`  📧 Email: ${chalk.gray(keyData.userInfo.email)}`);
          }
          console.log(`  📅 Added: ${chalk.gray(new Date(keyData.loginTime).toLocaleDateString())}`);
          console.log('');
        }
        return;
      }
      
      // Switch active key
      if (options.switch) {
        const success = auth.setActiveKey(options.switch);
        if (success) {
          const keyInfo = auth.getKeyInfo(options.switch);
          console.log(chalk.green(`✅ Switched to: ${keyInfo.nickname}`));
        } else {
          console.log(chalk.red(`❌ Key not found: ${options.switch}`));
          process.exit(1);
        }
        return;
      }
      
      // Add manual key
      if (options.add) {
        const nickname = options.nickname || `manual-${Date.now()}`;
        const keyId = auth.addManualKey(options.add, nickname);
        console.log(chalk.green(`✅ Added API key: ${nickname}`));
        console.log(chalk.gray(`📝 ID: ${keyId}`));
        
        // Validate the new key
        const validation = await auth.validateApiKey(options.add);
        if (validation.valid) {
          console.log(chalk.green(`✅ ${validation.message}`));
        } else {
          console.log(chalk.yellow(`⚠️  ${validation.message}`));
        }
        return;
      }
      
      // Remove key
      if (options.remove) {
        const keyInfo = auth.getKeyInfo(options.remove);
        if (!keyInfo) {
          console.log(chalk.red(`❌ Key not found: ${options.remove}`));
          process.exit(1);
        }
        
        const success = auth.removeKey(options.remove);
        if (success) {
          console.log(chalk.green(`✅ Removed API key: ${keyInfo.nickname}`));
        } else {
          console.log(chalk.red(`❌ Failed to remove key: ${options.remove}`));
          process.exit(1);
        }
        return;
      }
      
      // Validate key
      if (options.validate !== undefined) {
        const keyToValidate = options.validate || auth.getActiveKeyId();
        if (!keyToValidate) {
          console.log(chalk.red('❌ No key specified and no active key found'));
          process.exit(1);
        }
        
        const keyInfo = auth.getKeyInfo(keyToValidate);
        const apiKey = keyInfo ? keyInfo.key : keyToValidate;
        
        console.log(chalk.cyan('🔍 Validating API key...'));
        const validation = await auth.validateApiKey(apiKey);
        
        if (validation.valid) {
          console.log(chalk.green(`✅ ${validation.message}`));
        } else {
          console.log(chalk.red(`❌ ${validation.message}`));
          process.exit(1);
        }
        return;
      }
      
      // Default: show help
      console.log(chalk.cyan('🔑 API Key Management'));
      console.log('');
      console.log('Available commands:');
      console.log('  avocavo keys --list                    List all stored keys');
      console.log('  avocavo keys --switch <keyId>          Switch active key');
      console.log('  avocavo keys --add <key> -n <name>     Add manual key');
      console.log('  avocavo keys --remove <keyId>          Remove a key');
      console.log('  avocavo keys --validate [keyId]        Validate key');
      console.log('');
      console.log('💡 Use --list to see available key IDs');
      
    } catch (error) {
      console.error(chalk.red(`❌ Keys management error: ${error.message}`));
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show login status and account information')
  .action(async () => {
    try {
      const isLoggedIn = auth.isLoggedIn();
      
      if (!isLoggedIn) {
        console.log(chalk.yellow('⚠️  Not logged in'));
        console.log(chalk.cyan('💡 Run: avocavo login'));
        return;
      }

      const apiKey = auth.getApiKey();
      const api = new NutritionAPI(apiKey, program.opts().baseUrl);
      
      console.log(chalk.green('✅ Logged in'));
      console.log(chalk.gray(`🔑 API Key: ${apiKey.substring(0, 12)}...`));
      
      try {
        const account = await api.getAccountUsage();
        console.log(chalk.cyan(`📊 Account: ${account.email}`));
        console.log(chalk.cyan(`🎟️  Tier: ${account.api_tier}`));
        console.log(chalk.cyan(`📈 Usage: ${account.usage.current_month}/${account.usage.monthly_limit || 'unlimited'}`));
        console.log(chalk.cyan(`📅 Reset: ${new Date(account.usage.reset_date).toLocaleDateString()}`));
      } catch (err) {
        console.log(chalk.yellow('⚠️  Could not fetch account details'));
        if (program.opts().verbose) {
          console.log(chalk.gray(err.message));
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ Status error: ${error.message}`));
      process.exit(1);
    }
  });

// Ingredient analysis command
program
  .command('ingredient <ingredient>')
  .description('Analyze a single ingredient for nutrition data')
  .option('-v, --verify', 'Include USDA verification URL')
  .action(async (ingredient, options) => {
    try {
      const api = getApiClient();
      const result = await api.analyzeIngredient(ingredient, options.verify);
      
      if (program.opts().json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (result.success) {
        console.log(chalk.green(`✅ ${result.ingredient}`));
        console.log(formatNutrition(result.nutrition));
        
        if (result.usda_match) {
          console.log(chalk.gray(`🔗 USDA: ${result.usda_match.description} (ID: ${result.usda_match.fdc_id})`));
        }
        
        if (options.verify && result.verification_url) {
          console.log(chalk.blue(`🔍 Verify: ${result.verification_url}`));
        }
        
        console.log(chalk.gray(`⏱️  Response time: ${result.processing_time_ms.toFixed(1)}ms`));
      } else {
        console.log(chalk.red(`❌ ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Analysis error: ${error.message}`));
      process.exit(1);
    }
  });

// Recipe analysis command
program
  .command('recipe')
  .description('Analyze a complete recipe for nutrition data')
  .option('-s, --servings <number>', 'Number of servings', '1')
  .option('-i, --ingredients <ingredients...>', 'Recipe ingredients')
  .option('-f, --file <file>', 'Read ingredients from file (one per line)')
  .action(async (options) => {
    try {
      let ingredients = [];
      
      if (options.file) {
        const fs = require('fs');
        const content = fs.readFileSync(options.file, 'utf8');
        ingredients = content.split('\\n').map(line => line.trim()).filter(line => line);
      } else if (options.ingredients) {
        ingredients = options.ingredients;
      } else {
        // Interactive mode
        const inquirer = require('inquirer');
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'ingredients',
            message: 'Enter ingredients (comma-separated):',
            validate: input => input.trim() ? true : 'Please enter at least one ingredient'
          }
        ]);
        ingredients = answers.ingredients.split(',').map(ing => ing.trim());
      }

      if (ingredients.length === 0) {
        console.log(chalk.red('❌ No ingredients provided'));
        process.exit(1);
      }

      const servings = parseInt(options.servings) || 1;
      const api = getApiClient();
      
      console.log(chalk.cyan(`🍳 Analyzing recipe with ${ingredients.length} ingredients (${servings} servings)...`));
      
      const result = await api.analyzeRecipe(ingredients, servings);
      
      if (program.opts().json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (result.success) {
        console.log(chalk.green('✅ Recipe analysis complete!'));
        console.log('');
        
        // Total nutrition
        console.log(chalk.bold('📊 Total Nutrition:'));
        console.log(formatNutrition(result.nutrition.total));
        console.log('');
        
        // Per-serving nutrition
        console.log(chalk.bold(`🍽️  Per Serving (${servings} servings):`));
        console.log(formatNutrition(result.nutrition.per_serving));
        console.log('');
        
        // Ingredient breakdown
        if (result.nutrition.ingredients && result.nutrition.ingredients.length > 0) {
          console.log(chalk.bold('📋 Ingredient Breakdown:'));
          const tableData = result.nutrition.ingredients.map(ing => [
            ing.success ? '✅' : '❌',
            ing.ingredient,
            ing.success ? `${ing.nutrition.calories}` : 'N/A',
            ing.success ? `${ing.nutrition.protein}g` : 'N/A',
            ing.success ? `${ing.nutrition.total_fat}g` : 'N/A',
            ing.success ? `${ing.nutrition.carbohydrates}g` : 'N/A'
          ]);
          
          console.log(formatTable([
            ['Status', 'Ingredient', 'Calories', 'Protein', 'Fat', 'Carbs'],
            ...tableData
          ]));
        }
        
        console.log(chalk.gray(`🎯 USDA matches: ${result.usda_matches}/${ingredients.length}`));
        console.log(chalk.gray(`⏱️  Response time: ${result.processing_time_ms.toFixed(1)}ms`));
      } else {
        console.log(chalk.red(`❌ ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Recipe analysis error: ${error.message}`));
      process.exit(1);
    }
  });

// Batch analysis command
program
  .command('batch')
  .description('Analyze multiple ingredients efficiently (Starter+ plans)')
  .option('-i, --ingredients <ingredients...>', 'Ingredients to analyze')
  .option('-f, --file <file>', 'Read ingredients from file (one per line)')
  .action(async (options) => {
    try {
      let ingredients = [];
      
      if (options.file) {
        const fs = require('fs');
        const content = fs.readFileSync(options.file, 'utf8');
        ingredients = content.split('\\n').map(line => line.trim()).filter(line => line);
      } else if (options.ingredients) {
        ingredients = options.ingredients;
      } else {
        console.log(chalk.red('❌ Please provide ingredients via --ingredients or --file'));
        process.exit(1);
      }

      if (ingredients.length === 0) {
        console.log(chalk.red('❌ No ingredients provided'));
        process.exit(1);
      }

      const api = getApiClient();
      
      console.log(chalk.cyan(`⚡ Batch analyzing ${ingredients.length} ingredients...`));
      
      const result = await api.analyzeBatch(ingredients);
      
      if (program.opts().json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (result.success) {
        console.log(chalk.green(`✅ Batch analysis complete!`));
        console.log(chalk.cyan(`📊 Processed: ${result.successful_matches}/${result.batch_size} ingredients`));
        console.log('');
        
        // Results table
        const tableData = result.results.map(item => [
          item.success ? '✅' : '❌',
          item.ingredient,
          item.success ? `${item.nutrition.calories_total}` : 'N/A',
          item.success ? `${item.nutrition.protein_total}g` : 'N/A',
          item.success ? `${item.nutrition.total_fat_total}g` : 'N/A',
          item.success ? `${item.nutrition.carbohydrates_total}g` : 'N/A'
        ]);
        
        console.log(formatTable([
          ['Status', 'Ingredient', 'Calories', 'Protein', 'Fat', 'Carbs'],
          ...tableData
        ]));
        
        console.log(chalk.gray(`⏱️  Response time: ${result.processing_time_ms.toFixed(1)}ms`));
      } else {
        console.log(chalk.red(`❌ ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Batch analysis error: ${error.message}`));
      process.exit(1);
    }
  });

// Health check command
program
  .command('health')
  .description('Check API health and status')
  .action(async () => {
    try {
      const api = getApiClient(false); // Don't require auth for health check
      const result = await api.healthCheck();
      
      if (program.opts().json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(chalk.green(`✅ API Status: ${result.status}`));
      console.log(chalk.cyan(`🔧 Version: ${result.version}`));
      
      if (result.services) {
        console.log(chalk.bold('🔌 Services:'));
        Object.entries(result.services).forEach(([service, status]) => {
          const icon = (status === 'available' || status === 'connected' || status.includes('total')) ? '✅' : 
                      status === 'degraded' ? '⚠️' : '❌';
          console.log(`  ${icon} ${service}: ${status}`);
        });
      }
      
      if (result.performance) {
        console.log(chalk.bold('⚡ Performance:'));
        console.log(`  📊 Avg Response: ${result.performance.avg_response_time_ms}ms`);
        console.log(`  💾 Cache Hit Rate: ${result.performance.cache_hit_rate}%`);
        
        if (result.performance.uptime) {
          console.log(`  ⏱️  Uptime: ${result.performance.uptime}`);
        }
        if (result.performance.api_calls_today !== undefined) {
          console.log(`  📈 API Calls Today: ${result.performance.api_calls_today}`);
        }
        if (result.performance.active_users !== undefined) {
          console.log(`  👥 Active Users: ${result.performance.active_users}`);
        }
      }
      
      if (result.dashboard_data) {
        console.log(chalk.bold('📊 Dashboard Stats:'));
        if (result.dashboard_data.total_users) {
          console.log(`  👤 Total Users: ${result.dashboard_data.total_users}`);
        }
        if (result.dashboard_data.premium_users) {
          console.log(`  💎 Premium Users: ${result.dashboard_data.premium_users}`);
        }
        if (result.dashboard_data.total_recipes) {
          console.log(`  🍳 Total Recipes: ${result.dashboard_data.total_recipes}`);
        }
        if (result.dashboard_data.avg_rating) {
          console.log(`  ⭐ Avg Rating: ${result.dashboard_data.avg_rating.toFixed(1)}`);
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ Health check error: ${error.message}`));
      process.exit(1);
    }
  });

// Helper function to get API client
function getApiClient(requireAuth = true) {
  const globalOpts = program.opts();
  
  let apiKey = globalOpts.apiKey;
  
  if (!apiKey && requireAuth) {
    apiKey = auth.getApiKey();
    if (!apiKey) {
      console.error(chalk.red('❌ Not logged in. Run: avocavo login'));
      process.exit(1);
    }
  }
  
  return new NutritionAPI(apiKey, globalOpts.baseUrl);
}

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`❌ Unknown command: ${program.args.join(' ')}`));
  console.log(chalk.cyan('💡 Run: avocavo --help'));
  process.exit(1);
});

// Add help examples
program.addHelpText('after', `

Examples:
  $ avocavo login                          # Login with Google OAuth
  $ avocavo status                         # Check login status
  $ avocavo keys --list                    # List all stored API keys
  $ avocavo keys --switch <keyId>          # Switch active API key
  $ avocavo ingredient "1 cup rice"        # Analyze single ingredient
  $ avocavo recipe -i "2 cups flour" "1 cup milk" -s 8  # Analyze recipe
  $ avocavo batch -i "1 cup rice" "2 tbsp oil" "4 oz chicken"  # Batch analysis
  $ avocavo health                         # Check API health

Authentication:
  $ avocavo login                          # OAuth login (recommended)
  $ avocavo keys --add <key> -n "prod"     # Add manual API key
  $ avocavo -k your_api_key ingredient ... # Use API key directly

Documentation:
  https://docs.avocavo.app
`);

// Parse command line
program.parse();