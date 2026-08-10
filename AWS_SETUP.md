# AWS Setup Guide for CloudVault

This guide provides step-by-step instructions for provisioning the necessary AWS resources for the CloudVault application.

## 1. Setting up S3 bucket CORS, Versioning, and Lifecycle policies

1. **Create the S3 Bucket:**
   - Log in to the AWS Management Console and navigate to **S3**.
   - Click **Create bucket**.
   - Enter a unique bucket name (e.g., `cloudvault-storage-[your-unique-id]`).
   - Select your desired AWS Region.
   - Leave other default settings (Block Public Access enabled) and click **Create bucket**.

2. **Configure CORS:**
   - Go to your newly created bucket and select the **Permissions** tab.
   - Scroll down to **Cross-origin resource sharing (CORS)** and click **Edit**.
   - Paste the following JSON configuration to allow your frontend to upload/download files directly (adjust `AllowedOrigins` as needed for production):
     ```json
     [
         {
             "AllowedHeaders": ["*"],
             "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
             "AllowedOrigins": ["*"],
             "ExposeHeaders": ["ETag"]
         }
     ]
     ```
   - Click **Save changes**.

3. **Enable Versioning:**
   - Select the **Properties** tab for your bucket.
   - Under **Bucket Versioning**, click **Edit**.
   - Select **Enable** and click **Save changes**.

4. **Set Lifecycle Policies:**
   - Go to the **Management** tab and click **Create lifecycle rule**.
   - Name the rule (e.g., `DeleteOldVersionsAndDeletedFiles`).
   - Choose **Apply to all objects in the bucket**.
   - Under **Lifecycle rule actions**, select:
     - *Permanently delete noncurrent versions of objects*
     - *Expire current versions of objects* (optional, if you want all objects to expire after 90 days).
   - Configure the timeline (e.g., 90 days after becoming noncurrent).
   - Click **Create rule**.

## 2. Deploying DynamoDB tables and configuring primary/sort keys

1. **Create the Table:**
   - Navigate to the **DynamoDB** console.
   - Click **Create table**.
   - **Table name**: `CloudVaultFiles`
   - **Partition key (Primary key)**: `user_id` (String)
   - **Sort key**: `file_id` (String)
   - Leave Default settings for table settings or customize capacity if needed.
   - Click **Create table**.

2. **Optional: Add Global Secondary Indexes (GSI):**
   - If you frequently query by file status or upload date for cleanup tasks, you may want to create a GSI on `status` or `upload_date`.

## 3. Deploying Lambda functions and attaching IAM Execution Roles

1. **Create IAM Role:**
   - Navigate to the **IAM** console.
   - Click **Roles** -> **Create role**.
   - Select **AWS service** -> **Lambda**.
   - Attach the following managed policies:
     - `AWSLambdaBasicExecutionRole`
     - `AmazonS3FullAccess` (or restrict to your specific bucket)
     - `AmazonDynamoDBFullAccess` (or restrict to your specific table)
     - `AmazonSNSFullAccess` (for the notifications Lambda)
   - Name the role (e.g., `CloudVaultLambdaRole`) and create it.

2. **Deploy the Cleanup Lambda:**
   - Navigate to the **Lambda** console and click **Create function**.
   - Name it `CloudVaultCleanup`.
   - Runtime: **Python 3.9** (or latest).
   - Under **Execution role**, choose **Use an existing role** and select the `CloudVaultLambdaRole` created earlier.
   - Copy the contents of `/backend/cleanup_lambda.py` into the inline code editor or upload as a ZIP.
   - Set environment variables:
     - `DYNAMODB_TABLE_NAME`: `CloudVaultFiles`
     - `S3_BUCKET_NAME`: your S3 bucket name.
   - Click **Deploy**.
   - Configure an **EventBridge (CloudWatch Events)** trigger to run this function on a schedule (e.g., `rate(1 day)`).

3. **Deploy the Notifications Lambda:**
   - Repeat the process to create another function named `CloudVaultNotifications`.
   - Copy the contents of `/backend/notifications.py`.
   - Set environment variable: `SNS_TOPIC_ARN` to your SNS Topic ARN.
   - Click **Deploy**.

## 4. Linking API Gateway endpoints to the frontend `.env` configuration file

1. **Create an API Gateway (REST or HTTP API):**
   - In the API Gateway console, build a new API and define routes (e.g., `POST /upload`, `GET /files`).
   - Integrate these routes with your backend Lambda functions or other backend services.
   - Deploy the API to a stage (e.g., `prod`).
   - Copy the **Invoke URL** (e.g., `https://abcdef123.execute-api.us-east-1.amazonaws.com/prod`).

2. **Update Frontend `.env` File:**
   - In the root of your frontend project, open or create the `.env.local` or `.env` file.
   - Add your API Gateway URL and any other necessary configuration values:
     ```env
     NEXT_PUBLIC_API_BASE_URL=https://abcdef123.execute-api.us-east-1.amazonaws.com/prod
     # If using Cognito for auth, add those parameters as well
     NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
     NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxx
     ```
   - Restart your Next.js development server for the changes to take effect.
