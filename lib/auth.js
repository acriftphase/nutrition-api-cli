const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const open = require('open');
const Conf = require('conf');

class AuthManager {
  constructor(baseUrl = 'https://app.avocavo.app') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.config = new Conf({
      projectName: 'avocavo-nutrition',
      configName: 'auth'
    });
  }

  isLoggedIn() {
    const apiKey = this.config.get('apiKey');
    const loginTime = this.config.get('loginTime');
    
    // Basic check - has API key and logged in within last 30 days
    if (!apiKey || !loginTime) {
      return false;
    }
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return loginTime > thirtyDaysAgo;
  }

  getApiKey() {
    // Get the active API key (either default or selected)
    const activeKeyId = this.config.get('activeKey');
    if (activeKeyId) {
      const keys = this.config.get('apiKeys', {});
      const keyData = keys[activeKeyId];
      return keyData ? keyData.key : null;
    }
    
    // Fallback to legacy single key for backwards compatibility
    return this.config.get('apiKey');
  }

  getUserInfo() {
    return this.config.get('userInfo', {});
  }

  async login(provider = 'google') {
    console.log(chalk.cyan(`🔐 Starting ${provider} OAuth login...`));
    
    try {
      // Step 1: Initiate OAuth
      const spinner = ora('Initiating OAuth login...').start();
      
      const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
        provider
      });
      
      if (!response.data.success) {
        spinner.fail('Failed to initiate OAuth');
        console.error(chalk.red(response.data.error));
        return false;
      }
      
      const { session_id, oauth_url } = response.data;
      
      spinner.succeed('OAuth session created');
      
      // Step 2: Open browser
      console.log(chalk.cyan('🌐 Opening browser for authentication...'));
      console.log(chalk.gray(`If browser doesn't open automatically, visit: ${oauth_url}`));
      
      try {
        await open(oauth_url);
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not open browser automatically'));
        console.log(chalk.cyan(`Please manually open: ${oauth_url}`));
      }
      
      // Step 3: Poll for completion
      return await this.pollForCompletion(session_id);
      
    } catch (error) {
      console.error(chalk.red(`❌ Login initiation failed: ${error.message}`));
      return false;
    }
  }

  async pollForCompletion(sessionId, timeout = 300000, pollInterval = 2000) {
    const spinner = ora('Waiting for login completion...').start();
    const startTime = Date.now();
    
    try {
      while (Date.now() - startTime < timeout) {
        try {
          const response = await axios.get(`${this.baseUrl}/api/auth/status/${sessionId}`);
          const data = response.data;
          
          if (data.status === 'completed') {
            spinner.succeed('Login completed successfully!');
            
            // Store credentials in new multi-key format
            const keyId = this.generateKeyId(data.user_info?.email, data.provider);
            const keyData = {
              key: data.api_key,
              userInfo: data.user_info || {},
              loginTime: Date.now(),
              provider: data.provider || 'google',
              nickname: data.user_info?.email || `${data.provider || 'oauth'}-${Date.now()}`
            };
            
            const keys = this.config.get('apiKeys', {});
            keys[keyId] = keyData;
            this.config.set('apiKeys', keys);
            this.config.set('activeKey', keyId);
            
            // Keep legacy format for backwards compatibility
            this.config.set('apiKey', data.api_key);
            this.config.set('userInfo', data.user_info || {});
            this.config.set('loginTime', Date.now());
            this.config.set('provider', data.provider || 'google');
            
            console.log(chalk.green(`✅ Logged in as ${data.user_info?.email || 'Unknown'}`));
            return true;
            
          } else if (data.status === 'failed') {
            spinner.fail('Login failed');
            console.error(chalk.red(data.error || 'Unknown error'));
            return false;
            
          } else if (data.status === 'pending') {
            // Update spinner text with elapsed time
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            spinner.text = `Waiting for login completion... (${elapsed}s)`;
          }
          
        } catch (error) {
          if (error.response?.status === 404) {
            spinner.fail('OAuth session expired');
            console.error(chalk.red('Session expired or not found'));
            return false;
          }
          
          // Continue polling on other errors
          spinner.text = `Connection error, retrying... (${Math.floor((Date.now() - startTime) / 1000)}s)`;
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      spinner.fail('Login timeout');
      console.error(chalk.red('Login timed out - please try again'));
      return false;
      
    } catch (error) {
      spinner.fail('Login polling failed');
      console.error(chalk.red(`Polling error: ${error.message}`));
      return false;
    }
  }

  logout() {
    this.config.clear();
    console.log(chalk.green('✅ Successfully logged out'));
  }

  getLoginInfo() {
    return {
      apiKey: this.config.get('apiKey'),
      userInfo: this.config.get('userInfo', {}),
      loginTime: this.config.get('loginTime'),
      provider: this.config.get('provider')
    };
  }

  async validateApiKey(apiKey = null) {
    const keyToValidate = apiKey || this.getApiKey();
    
    if (!keyToValidate) {
      return { valid: false, message: 'No API key found' };
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/user/`, {
        headers: {
          'Authorization': `Bearer ${keyToValidate}`
        },
        timeout: 10000
      });
      
      if (response.status === 200) {
        const account = response.data.account || {};
        return { 
          valid: true, 
          message: `Valid - ${account.email || 'Unknown'} (${account.api_tier || 'Unknown'} tier)` 
        };
      } else {
        return { valid: false, message: `Invalid response: HTTP ${response.status}` };
      }
      
    } catch (error) {
      if (error.response?.status === 401) {
        return { valid: false, message: 'Invalid or expired API key' };
      } else {
        return { valid: false, message: `Validation failed: ${error.message}` };
      }
    }
  }

  // Key management methods
  generateKeyId(email, provider) {
    const timestamp = Date.now();
    const emailPart = email ? email.split('@')[0] : 'user';
    return `${provider || 'oauth'}-${emailPart}-${timestamp}`.toLowerCase();
  }

  getAllKeys() {
    return this.config.get('apiKeys', {});
  }

  getActiveKeyId() {
    return this.config.get('activeKey');
  }

  setActiveKey(keyId) {
    const keys = this.getAllKeys();
    if (!keys[keyId]) {
      return false;
    }
    this.config.set('activeKey', keyId);
    return true;
  }

  addManualKey(apiKey, nickname) {
    const keyId = `manual-${nickname.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const keyData = {
      key: apiKey,
      userInfo: {},
      loginTime: Date.now(),
      provider: 'manual',
      nickname: nickname
    };
    
    const keys = this.config.get('apiKeys', {});
    keys[keyId] = keyData;
    this.config.set('apiKeys', keys);
    
    return keyId;
  }

  removeKey(keyId) {
    const keys = this.config.get('apiKeys', {});
    if (!keys[keyId]) {
      return false;
    }
    
    delete keys[keyId];
    this.config.set('apiKeys', keys);
    
    // If this was the active key, clear it
    if (this.config.get('activeKey') === keyId) {
      this.config.delete('activeKey');
      
      // Set first remaining key as active, if any
      const remainingKeys = Object.keys(keys);
      if (remainingKeys.length > 0) {
        this.config.set('activeKey', remainingKeys[0]);
      }
    }
    
    return true;
  }

  getKeyInfo(keyId) {
    const keys = this.getAllKeys();
    return keys[keyId] || null;
  }
}

module.exports = { AuthManager };