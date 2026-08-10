import boto3
import json

def setup_cognito():
    # Initialize the Cognito Identity Provider client
    client = boto3.client('cognito-idp', region_name='us-east-1')

    print("Creating Cognito User Pool...")

    # 1. Create a User Pool
    pool_response = client.create_user_pool(
        PoolName='CloudVaultUserPool',
        Policies={
            'PasswordPolicy': {
                'MinimumLength': 8,
                'RequireUppercase': True,
                'RequireLowercase': True,
                'RequireNumbers': True,
                'RequireSymbols': False
            }
        },
        AutoVerifiedAttributes=['email']
    )

    user_pool_id = pool_response['UserPool']['Id']
    print(f"Created User Pool with ID: {user_pool_id}")

    print("Creating User Pool Client...")

    # 2. Create a User Pool Client
    client_response = client.create_user_pool_client(
        UserPoolId=user_pool_id,
        ClientName='CloudVaultClient',
        GenerateSecret=False,
        ExplicitAuthFlows=[
            'ALLOW_USER_PASSWORD_AUTH',
            'ALLOW_REFRESH_TOKEN_AUTH'
        ]
    )

    client_id = client_response['UserPoolClient']['ClientId']
    print(f"Created User Pool Client with ID: {client_id}")

    # Initialize the Cognito Identity client
    identity_client = boto3.client('cognito-identity', region_name='us-east-1')

    print("Creating Identity Pool...")

    # 3. Create an Identity Pool
    identity_pool_response = identity_client.create_identity_pool(
        IdentityPoolName='CloudVaultIdentityPool',
        AllowUnauthenticatedIdentities=False,
        CognitoIdentityProviders=[
            {
                'ProviderName': f"cognito-idp.us-east-1.amazonaws.com/{user_pool_id}",
                'ClientId': client_id,
                'ServerSideTokenCheck': False
            }
        ]
    )

    identity_pool_id = identity_pool_response['IdentityPoolId']
    print(f"Created Identity Pool with ID: {identity_pool_id}")

    print("\n--- Cognito Setup Complete ---")
    print(f"USER_POOL_ID: {user_pool_id}")
    print(f"CLIENT_ID: {client_id}")
    print(f"IDENTITY_POOL_ID: {identity_pool_id}")

if __name__ == "__main__":
    # In a real environment, this would execute against AWS.
    # Note: Requires configured AWS credentials (e.g., via aws configure)
    try:
        setup_cognito()
    except Exception as e:
        print(f"Error setting up Cognito: {e}")
        print("Note: Ensure you have valid AWS credentials configured in your environment to run this script successfully.")
