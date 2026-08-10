import json
import logging
import boto3
import os

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize SNS client
sns = boto3.client('sns')

# Environment variables
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

def send_notification(subject, message):
    """
    Helper function to send a notification via Amazon SNS.
    """
    logger.info(f"Attempting to send notification. Subject: {subject}")

    if not SNS_TOPIC_ARN:
        logger.error("SNS_TOPIC_ARN environment variable is not set. Cannot send notification.")
        return False

    try:
        response = sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        logger.info(f"Notification sent successfully. MessageId: {response.get('MessageId')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")
        return False

def lambda_handler(event, context):
    """
    Example Lambda handler that could be triggered by EventBridge or S3 events
    to notify users of backup or restore completions.
    """
    logger.info(f"Notifications lambda triggered with event: {json.dumps(event)}")

    try:
        # Example logic parsing a generic event
        action = event.get('action', 'backup')
        status = event.get('status', 'completed')
        file_name = event.get('file_name', 'unknown_file')
        user_id = event.get('user_id', 'unknown_user')

        if status.lower() == 'completed':
            subject = f"CloudVault: {action.capitalize()} Completed Successfully"
            message = f"Hello User {user_id},\n\nYour {action} for the file '{file_name}' has completed successfully.\n\nThank you for using CloudVault!"
        else:
            subject = f"CloudVault: {action.capitalize()} Failed"
            message = f"Hello User {user_id},\n\nWe encountered an error during your {action} for the file '{file_name}'. Status: {status}.\n\nPlease try again or contact support."

        success = send_notification(subject, message)

        if success:
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Notification sent successfully.'})
            }
        else:
            return {
                'statusCode': 500,
                'body': json.dumps({'message': 'Failed to send notification.'})
            }

    except Exception as e:
        logger.error(f"Error in notifications lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal error processing notification.', 'error': str(e)})
        }
