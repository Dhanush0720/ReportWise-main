# Quick API Setup for Deployment

## What Changed
✅ API key removed from code  
✅ API key slot is now EMPTY in `.env`  
✅ You add your own API key during deployment  

## How to Deploy

### Step 1: Get Your API Key
1. Go to: https://aistudio.google.com/apikey
2. Create or copy your API key
3. Keep it safe (don't share it)

### Step 2: Set Environment Variable

#### Local Development
Edit `backend/.env`:
```
GOOGLE_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.5-flash
LOG_LEVEL=INFO
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
```

#### Docker Deployment
```bash
docker run \
  -e GOOGLE_API_KEY=your_api_key_here \
  -e GEMINI_MODEL=gemini-3.5-flash \
  -e ENVIRONMENT=production \
  your-image-name
```

#### Heroku Deployment
```bash
heroku config:set GOOGLE_API_KEY=your_api_key_here
heroku config:set GEMINI_MODEL=gemini-3.5-flash
heroku config:set ENVIRONMENT=production
```

#### AWS Lambda / EC2
Set environment variables in:
- Systems Manager Parameter Store
- EC2 User Data
- Lambda Environment Variables
- ECS Task Definition

Example:
```json
{
  "name": "GOOGLE_API_KEY",
  "value": "your_api_key_here"
}
```

#### Google Cloud Run
```bash
gcloud run deploy your-service \
  --set-env-vars GOOGLE_API_KEY=your_api_key_here \
  --set-env-vars GEMINI_MODEL=gemini-3.5-flash \
  --set-env-vars ENVIRONMENT=production
```

#### Azure
```bash
az containerapp env create \
  --environment-variables GOOGLE_API_KEY=your_api_key_here GEMINI_MODEL=gemini-3.5-flash
```

### Step 3: Restart Backend
```bash
python main.py
```

Or if using Docker:
```bash
docker restart your-container
```

### Step 4: Test
1. Open frontend: http://localhost:3000 (or your deployed URL)
2. Upload a file
3. Ask a question in the chat
4. AI response should work!

---

## Files Modified

```
backend/.env          <- EMPTY GOOGLE_API_KEY
backend/.env.example  <- Template showing where to add key
backend/gemini_direct.py   <- Now validates API key exists
backend/main.py            <- Better error messages
```

## What Users Will See

### Without API Key
```
⚙️ API Configuration Needed

To use the AI analysis feature, please:
1. Get your Gemini API key from: https://aistudio.google.com/apikey
2. Add it to your environment
3. Restart the backend

In the meantime, you can still:
- Upload and explore your data
- Create visualizations
- Export to Tableau or Power BI
- Generate reports and presentations
```

### With Invalid API Key
```
⚠️ API Key Issue

The provided API key has permission issues. Please:
1. Verify your API key is valid and active
2. Get a fresh key from: https://aistudio.google.com/apikey
3. Update your environment variables
4. Restart the backend
```

---

## Key Points

✅ **No API key in code** - Safe to commit to GitHub  
✅ **Easy to change** - Set environment variable, restart  
✅ **Works everywhere** - Local, Docker, Cloud, Serverless  
✅ **Clear messages** - Users know what to do if key is missing  
✅ **Graceful fallback** - App works without AI (shows helpful messages)  

---

## Security

- ✅ Never hardcode API keys in code
- ✅ Use environment variables only
- ✅ Rotate keys regularly
- ✅ Restrict key permissions in Google Console
- ✅ Monitor usage for unusual activity

---

## Getting the API Key

1. **Free Tier** (recommended for testing):
   - https://aistudio.google.com/apikey
   - Automatic API key generation
   - Free tier limits apply

2. **Production**:
   - https://console.cloud.google.com
   - Set up billing (needed for production)
   - Configure quotas and monitoring
   - Add team members

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not set" | Add GOOGLE_API_KEY to environment |
| "Permission denied" | Check API key is valid, get new one |
| "Quota exceeded" | Wait or upgrade billing |
| "Model not found" | Check GEMINI_MODEL is valid |

---

## Ready to Deploy!

Your app is now:
✅ Production-ready  
✅ Secure (no hardcoded keys)  
✅ Easy to configure  
✅ Works on any platform  

Just add your API key when deploying! 🚀
