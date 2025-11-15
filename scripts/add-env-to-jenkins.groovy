import jenkins.model.Jenkins
import hudson.model.EnvironmentVariablesNodeProperty

def instance = Jenkins.getInstance()
def globalNodeProperties = instance.getGlobalNodeProperties()
def envVarsProperty = globalNodeProperties.getAll(hudson.model.EnvironmentVariablesNodeProperty)

// Create new property if it doesn't exist
if (envVarsProperty.isEmpty()) {
    def newEnvVarsProperty = new hudson.model.EnvironmentVariablesNodeProperty()
    globalNodeProperties.add(newEnvVarsProperty)
    envVarsProperty = newEnvVarsProperty
} else {
    envVarsProperty = envVarsProperty.get(0)
}

def envVars = envVarsProperty.getEnvVars()

// Add environment variables
envVars.put("MONGO_ROOT_USER", "admin")
envVars.put("MONGO_ROOT_PASSWORD", "eZUTEX5ctzOu7DwXAFbeTHr3")
envVars.put("MONGODB_URI", "mongodb://admin:eZUTEX5ctzOu7DwXAFbeTHr3@mongodb:27017/cptsd-cms?authSource=admin")
envVars.put("S3_ENDPOINT", "http://minio:9000")
envVars.put("S3_REGION", "us-east-1")
envVars.put("S3_ACCESS_KEY_ID", "minioadmin")
envVars.put("S3_SECRET_ACCESS_KEY", "H7Ata1rYPOa8urLaz23VNue6")
envVars.put("S3_BUCKET_NAME", "cptsd-cms")
envVars.put("OPENAI_API_KEY", "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")
envVars.put("ADMIN_EMAIL", "janjalkarabhishek3@gmail.com")
envVars.put("ADMIN_PASSWORD", "XFwg6TsoOZoWY98D")
envVars.put("NEXTAUTH_URL", "https://cms.cptsd.in")
envVars.put("NEXTAUTH_SECRET", "U92SxD/ysgTLquYAB256IobpU1wH++9P5JpeMuS5eWM")

instance.save()
println "✅ Added 13 environment variables to Jenkins Global Properties"

