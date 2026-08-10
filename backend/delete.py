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
