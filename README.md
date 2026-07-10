npm run bridge -- --storage-path=.data --log-level=INFO

docker run --name mrpc -d --network host --restart unless-stopped -v /ground/smb/Code/mrpc-node/.data:/usr/src/app/.data mrpc-node