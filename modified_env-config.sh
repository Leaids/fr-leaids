# .env

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crm?schema=public"
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# APIs
# Replaced predefined questions with ChatGPT API
CHATGPT_API_KEY="your-openai-key"
ELEVENLABS_API_KEY="your-elevenlabs-key"
CARTESIA_API_KEY="your-cartesia-key"
DEEPGRAM_API_KEY="your-deepgram-key"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# AWS
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="eu-west-1"
