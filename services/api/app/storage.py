from pathlib import Path
from typing import BinaryIO

import boto3

from .config import get_settings


class ObjectStorage:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.local_root = self.settings.storage_dir.resolve()
        self._s3 = None
        if self.settings.storage_backend == "s3":
            self._s3 = boto3.client(
                "s3",
                endpoint_url=self.settings.s3_endpoint_url or None,
                region_name=self.settings.s3_region,
                aws_access_key_id=self.settings.s3_access_key_id,
                aws_secret_access_key=self.settings.s3_secret_access_key,
            )

    def ensure_ready(self) -> None:
        if self._s3:
            try:
                self._s3.head_bucket(Bucket=self.settings.s3_bucket)
            except Exception:
                self._s3.create_bucket(Bucket=self.settings.s3_bucket)
            return
        self.local_root.mkdir(parents=True, exist_ok=True)

    def put(self, key: str, file: BinaryIO, content_type: str) -> None:
        if self._s3:
            self._s3.upload_fileobj(file, self.settings.s3_bucket, key, ExtraArgs={"ContentType": content_type})
            return
        target = (self.local_root / key).resolve()
        if self.local_root not in target.parents:
            raise ValueError("Object key escaped storage root")
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("wb") as output:
            while chunk := file.read(1024 * 1024):
                output.write(chunk)

    def read_bytes(self, key: str) -> bytes:
        if self._s3:
            response = self._s3.get_object(Bucket=self.settings.s3_bucket, Key=key)
            return response["Body"].read()
        return (self.local_root / key).read_bytes()

    def delete(self, key: str) -> None:
        if self._s3:
            self._s3.delete_object(Bucket=self.settings.s3_bucket, Key=key)
            return
        target = (self.local_root / key).resolve()
        if self.local_root not in target.parents:
            raise ValueError("Object key escaped storage root")
        target.unlink(missing_ok=True)


storage = ObjectStorage()
