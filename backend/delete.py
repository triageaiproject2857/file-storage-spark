import json
import boto3
import os

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

BUCKET_NAME = os.environ.get('BUCKET_NAME')
TABLE_NAME = os.environ.get('TABLE_NAME')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
    }

    try:
        # Assuming ID is passed in path parameters e.g., /files/{id}
        path_parameters = event.get('pathParameters', {}) or {}
        file_id = path_parameters.get('id')

        if not file_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Missing file ID in path parameters'})
            }

        # 1. Get the item to find the s3Key
        response = table.get_item(Key={'id': file_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'File not found'})
            }

        item = response['Item']
        s3_key = item.get('s3Key')

        # 2. Delete from S3
        if s3_key:
            try:
                s3_client.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
            except Exception as e:
                print(f"Error deleting from S3: {str(e)}")
                # Continue to delete from DynamoDB even if S3 delete fails

        # 3. Delete from DynamoDB
        table.delete_item(Key={'id': file_id})

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'File deleted successfully', 'id': file_id})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
import boto3

def restore_soft_deleted_s3_object(bucket_name, object_key):
    """
    Restores a soft-deleted object from an S3 bucket with versioning enabled.
    In S3, "soft-deleting" an object adds a Delete Marker as the latest version.
    To restore it, we find the delete marker and delete it, making the previous
    version the active one again.
    """
    s3_client = boto3.client('s3')

    try:
        # List the versions of the specific object key
        response = s3_client.list_object_versions(
            Bucket=bucket_name,
            Prefix=object_key
        )

        # Check if there are delete markers for this object
        if 'DeleteMarkers' in response:
            for marker in response['DeleteMarkers']:
                if marker['Key'] == object_key and marker['IsLatest']:
                    version_id = marker['VersionId']
                    print(f"Found latest delete marker for {object_key} (VersionId: {version_id}). Deleting it...")

                    # Delete the delete marker to restore the object
                    s3_client.delete_object(
                        Bucket=bucket_name,
                        Key=object_key,
                        VersionId=version_id
                    )

                    print(f"Successfully restored '{object_key}'.")
                    return True

            print(f"Object '{object_key}' is not currently soft-deleted (no latest delete marker found).")
            return False

        else:
            print(f"No delete markers found for object '{object_key}'.")
            return False

    except Exception as e:
        print(f"Error restoring object {object_key} from bucket {bucket_name}: {e}")
        return False

def soft_delete_s3_object(bucket_name, object_key):
    """
    Soft-deletes an object from a versioned S3 bucket.
    This creates a delete marker as the latest version.
    """
    s3_client = boto3.client('s3')

    try:
        print(f"Soft-deleting '{object_key}'...")
        s3_client.delete_object(
            Bucket=bucket_name,
            Key=object_key
        )
        print(f"Successfully soft-deleted '{object_key}'.")
        return True
    except Exception as e:
        print(f"Error soft-deleting object {object_key} from bucket {bucket_name}: {e}")
        return False

if __name__ == "__main__":
    # Example usage (requires configured AWS credentials and an S3 bucket with versioning enabled)
    # bucket = "my-versioned-bucket"
    # key = "test-file.txt"
    #
    # soft_delete_s3_object(bucket, key)
    # restore_soft_deleted_s3_object(bucket, key)
    pass
