# CloudVault Project Report

## Project Abstract
CloudVault is a secure, scalable, and user-friendly cloud storage application designed to provide users with a safe workspace for backing up and restoring important files. It bridges the gap between complex cloud infrastructure and an intuitive user interface, offering features like file uploads, downloads, history tracking, and automated lifecycle management. The goal of this project was to leverage modern cloud-native architectures to deliver a robust storage solution that ensures high availability, security, and performance.

## Architecture Diagram Description
The architecture of CloudVault is based on a modern, serverless cloud model on AWS, integrating seamlessly with a Next.js frontend:

1. **Frontend (Client Tier):**
   - A responsive web application built with **Next.js** and **React**.
   - Hosted on a CDN/Vercel or AWS Amplify for low-latency delivery.
   - Communicates with the backend via RESTful APIs.

2. **API & Routing (API Tier):**
   - **Amazon API Gateway** acts as the entry point for all backend requests, managing routing, rate limiting, and CORS.

3. **Compute (Logic Tier):**
   - **AWS Lambda** functions handle business logic in a serverless manner.
   - Operations include handling file metadata, orchestrating uploads, triggering automated cleanup processes, and sending notifications.

4. **Storage (Data Tier):**
   - **Amazon S3**: Used for reliable and scalable object storage. It stores the actual files uploaded by users. Bucket policies and lifecycle rules govern data retention.
   - **Amazon DynamoDB**: A NoSQL database used to store file metadata (e.g., file name, size, upload date, status, ownership) for fast querying and retrieval.

5. **Monitoring & Automation (Maintenance Tier):**
   - **Amazon EventBridge**: Triggers scheduled Lambda functions (e.g., daily cleanup tasks for deleted or old files).
   - **Amazon SNS**: Facilitates event-driven notifications (email/SMS) to alert users upon backup or restore completion.
   - **Amazon CloudWatch**: Provides centralized logging and monitoring for all Lambda executions and API requests.

## Technology Breakdown

### Frontend
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI, Lucide React (Icons), Sonner (Toast Notifications)
- **Language:** TypeScript

### Backend (AWS Services)
- **Compute:** AWS Lambda (Python scripts using `boto3`)
- **API Management:** Amazon API Gateway
- **Object Storage:** Amazon S3
- **Database:** Amazon DynamoDB
- **Automation & Scheduling:** Amazon EventBridge
- **Notifications:** Amazon Simple Notification Service (SNS)
- **Logging & Monitoring:** Amazon CloudWatch
- **Identity & Access:** AWS IAM (Role-based access control)

## Conclusion
The CloudVault project successfully demonstrates the implementation of a full-stack, serverless application. By offloading infrastructure management to AWS and utilizing a highly responsive Next.js frontend, the system is designed to scale dynamically, minimize operational overhead, and provide a secure environment for personal or enterprise file backups.
