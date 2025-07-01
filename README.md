# Avocavo Nutrition CLI

[![npm version](https://badge.fury.io/js/avocavo-nutrition-cli.svg)](https://badge.fury.io/js/avocavo-nutrition-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Command-line interface for the **Avocavo Nutrition API** - Get fast, accurate nutrition data for recipe ingredients with verified USDA sources.

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g avocavo-nutrition-cli

# Or use npx (no installation required)
npx avocavo-nutrition-cli --help
```

### Authentication

```bash
# Login with OAuth (recommended)
avocavo login

# Check login status
avocavo status
```

### Basic Usage

```bash
# Analyze a single ingredient
avocavo ingredient "1 cup chicken breast"

# Analyze a recipe
avocavo recipe -i "2 cups flour" "1 cup milk" "2 eggs" -s 8

# Batch analysis (Starter+ plans)
avocavo batch -i "1 cup rice" "2 tbsp oil" "4 oz salmon"

# Check API health
avocavo health
```

## 📊 Features

### ✅ OAuth Authentication
- **Seamless login** with Google or GitHub
- **Automatic API key management**
- **Secure credential storage**

### ⚡ Fast Analysis
- **Single ingredients** with USDA verification
- **Complete recipes** with per-serving calculations
- **Batch processing** for multiple ingredients
- **Sub-second responses** with intelligent caching

### 🎨 Beautiful Output
- **Color-coded results** for easy reading
- **Formatted tables** for complex data
- **Progress indicators** and status updates
- **JSON output** for scripting

### 🔧 Developer Friendly
- **Cross-platform** (Windows, macOS, Linux)
- **File input** for ingredient lists
- **Scriptable** with JSON output
- **Comprehensive error handling**

## 📋 Command Reference

### Authentication Commands

#### `avocavo login [options]`
Login using OAuth (Google or GitHub)

```bash
avocavo login                    # Login with Google (default)
avocavo login -p github          # Login with GitHub
```

**Options:**
- `-p, --provider <provider>` - OAuth provider (google or github)

#### `avocavo logout`
Logout and remove stored credentials

#### `avocavo status`
Show current login status and account information

### Analysis Commands

#### `avocavo ingredient <ingredient> [options]`
Analyze a single ingredient for nutrition data

```bash
avocavo ingredient "1 cup cooked rice"
avocavo ingredient "100g chicken breast" --verify
```

**Options:**
- `-v, --verify` - Include USDA verification URL

#### `avocavo recipe [options]`
Analyze a complete recipe with per-serving calculations

```bash
# Interactive mode
avocavo recipe

# Command line ingredients
avocavo recipe -i "2 cups flour" "1 cup milk" "2 eggs" -s 8

# From file
avocavo recipe -f ingredients.txt -s 4
```

**Options:**
- `-s, --servings <number>` - Number of servings (default: 1)
- `-i, --ingredients <ingredients...>` - Recipe ingredients
- `-f, --file <file>` - Read ingredients from file (one per line)

#### `avocavo batch [options]`
Efficiently analyze multiple ingredients (Starter+ plans)

```bash
avocavo batch -i "1 cup rice" "2 tbsp oil" "4 oz salmon"
avocavo batch -f shopping-list.txt
```

**Options:**
- `-i, --ingredients <ingredients...>` - Ingredients to analyze
- `-f, --file <file>` - Read ingredients from file (one per line)

### Utility Commands

#### `avocavo health`
Check API health and performance metrics

### Global Options

- `-k, --api-key <key>` - API key (overrides stored credentials)
- `--base-url <url>` - API base URL (default: https://app.avocavo.app)
- `--json` - Output raw JSON (useful for scripting)
- `--verbose` - Verbose output for debugging
- `-h, --help` - Show help
- `-V, --version` - Show version

## 📁 File Input Format

Create a text file with one ingredient per line:

```text
# ingredients.txt
1 cup brown rice
2 tablespoons olive oil
4 oz grilled chicken breast
1 cup steamed broccoli
1/4 cup almonds
```

Then use it with:
```bash
avocavo recipe -f ingredients.txt -s 2
avocavo batch -f ingredients.txt
```

## 🎨 Output Examples

### Single Ingredient
```bash
$ avocavo ingredient "1 cup chicken breast"
✅ 1 cup chicken breast
  🔥 Calories: 231.0
  🥩 Protein: 43.5g
  🧈 Fat: 5.0g
  🌾 Carbs: 0.0g
  🌿 Fiber: 0.0g
  🧂 Sodium: 104.0mg
🔗 USDA: Chicken, broilers or fryers, breast, meat only, cooked, roasted (ID: 171077)
⏱️  Response time: 145.2ms
```

### Recipe Analysis
```bash
$ avocavo recipe -i "2 cups flour" "1 cup milk" "2 eggs" -s 8
🍳 Analyzing recipe with 3 ingredients (8 servings)...
✅ Recipe analysis complete!

📊 Total Nutrition:
  🔥 Calories: 1247.0
  🥩 Protein: 45.2g
  🧈 Fat: 18.4g
  🌾 Carbs: 220.8g
  🌿 Fiber: 7.2g
  🧂 Sodium: 287.0mg

🍽️  Per Serving (8 servings):
  🔥 Calories: 155.9
  🥩 Protein: 5.7g
  🧈 Fat: 2.3g
  🌾 Carbs: 27.6g
  🌿 Fiber: 0.9g
  🧂 Sodium: 35.9mg

📋 Ingredient Breakdown:
┌────────┬─────────────┬──────────┬─────────┬─────┬───────┐
│ Status │ Ingredient  │ Calories │ Protein │ Fat │ Carbs │
├────────┼─────────────┼──────────┼─────────┼─────┼───────┤
│ ✅     │ 2 cups flour│ 910      │ 25.4g   │ 2.4g│ 190g  │
│ ✅     │ 1 cup milk  │ 149      │ 7.7g    │ 8.0g│ 12g   │
│ ✅     │ 2 eggs      │ 155      │ 12.6g   │ 10.6g│ 1.1g  │
└────────┴─────────────┴──────────┴─────────┴─────┴───────┘
🎯 USDA matches: 3/3
⏱️  Response time: 234.5ms
```

## 🔐 Authentication Methods

### 1. OAuth Login (Recommended)
```bash
avocavo login
```
- Opens browser for Google/GitHub login
- Automatically stores API key securely
- No need to copy/paste API keys

### 2. Direct API Key
```bash
avocavo -k your_api_key_here ingredient "1 cup rice"
```
- Use your own API key directly
- Good for CI/CD and scripting

### 3. Environment Variable
```bash
export AVOCAVO_API_KEY=your_api_key_here
avocavo ingredient "1 cup rice"
```

## 💡 Usage Tips

### Scripting and Automation
```bash
# JSON output for scripting
avocavo ingredient "1 cup rice" --json | jq '.nutrition.calories_total'

# Batch process a shopping list
avocavo batch -f shopping-list.txt --json > nutrition-data.json

# Check if API is healthy before processing
avocavo health --json | jq -e '.status == "ok"' && echo "API is ready"
```

### Ingredient Format Tips
- **Include quantities**: "1 cup rice" instead of just "rice"
- **Be specific**: "brown rice" vs "white rice"
- **Use common units**: cups, tablespoons, ounces, grams
- **Include cooking method**: "grilled chicken" vs "fried chicken"

### Performance Optimization
- Use **batch processing** for multiple ingredients
- **File input** is faster than multiple CLI calls
- **Cache warming**: Common ingredients are cached for speed

## ❗ Error Handling

The CLI provides clear error messages and suggestions:

```bash
$ avocavo ingredient "unknown magical ingredient"
❌ Nutrition data not found

$ avocavo batch -i "too" "many" "ingredients" "for" "free" "tier"
❌ Batch size exceeds limit for free tier
💡 Upgrade to Starter plan for larger batches

$ avocavo ingredient "1 cup rice"
❌ Not logged in. Run: avocavo login
```

## 💰 Pricing & Plans

| Plan | Monthly Requests | Price | Batch Size |
|------|------------------|-------|------------|
| **Free Trial** | 100 | Free | 1 |
| **Starter** | 2,500 | $9.99/month | 5 |
| **Pro** | 25,000 | $49/month | 20 |
| **Enterprise** | 250,000+ | $249/month | 100 |

Start with **100 free requests** - no credit card required!

## 🔗 Links

- **Get API Key**: [nutrition.avocavo.app](https://nutrition.avocavo.app)
- **Documentation**: [docs.avocavo.app](https://docs.avocavo.app)
- **Python SDK**: [pypi.org/project/avocavo-nutrition](https://pypi.org/project/avocavo-nutrition)
- **Support**: api-support@avocavo.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

*Made with ❤️ by the Avocavo team*