import os
import requests

def upload_file_to_supabase(file_bytes: bytes, file_name: str, bucket_name: str = "images") -> str:
    """
    Uploads a file to Supabase Storage using the REST API and returns the public URL.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL or SUPABASE_KEY is missing from environment variables.")
        
    # Endpoint for uploading to storage: POST /storage/v1/object/{bucket}/{filename}
    upload_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{file_name}"
    
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apiKey": supabase_key,
        "Content-Type": "image/jpeg",
    }
    
    response = requests.post(upload_url, headers=headers, data=file_bytes)
    
    if response.status_code not in (200, 201):
        raise Exception(f"Failed to upload to Supabase: {response.text}")
        
    # Get the public URL: GET /storage/v1/object/public/{bucket}/{filename}
    public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{file_name}"
    return public_url
