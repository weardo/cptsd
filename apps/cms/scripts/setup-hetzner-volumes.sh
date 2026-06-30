#!/bin/bash
# Setup Hetzner Cloud Volumes for persistent storage
# Run this after attaching Hetzner Cloud Volumes to your server

set -e

echo "💾 Setting up Hetzner Cloud Volumes..."

# Mount point for volumes
MOUNT_POINT="/mnt/hetzner-volumes"

# Create mount point if it doesn't exist
if [ ! -d "$MOUNT_POINT" ]; then
    sudo mkdir -p "$MOUNT_POINT"
    echo "✅ Created mount point: $MOUNT_POINT"
fi

# Check if volumes are already mounted
if mountpoint -q "$MOUNT_POINT/mongodb" 2>/dev/null; then
    echo "✅ MongoDB volume already mounted"
else
    echo "📦 Please mount your Hetzner Cloud Volume for MongoDB:"
    echo "   sudo mount -t ext4 /dev/disk/by-id/scsi-0HC_Volume_[VOLUME_ID] $MOUNT_POINT/mongodb"
    echo ""
    echo "   To make it permanent, add to /etc/fstab:"
    echo "   /dev/disk/by-id/scsi-0HC_Volume_[VOLUME_ID] $MOUNT_POINT/mongodb ext4 defaults 0 2"
fi

if mountpoint -q "$MOUNT_POINT/minio" 2>/dev/null; then
    echo "✅ MinIO volume already mounted"
else
    echo "📦 Please mount your Hetzner Cloud Volume for MinIO:"
    echo "   sudo mount -t ext4 /dev/disk/by-id/scsi-0HC_Volume_[VOLUME_ID] $MOUNT_POINT/minio"
    echo ""
    echo "   To make it permanent, add to /etc/fstab:"
    echo "   /dev/disk/by-id/scsi-0HC_Volume_[VOLUME_ID] $MOUNT_POINT/minio ext4 defaults 0 2"
fi

# Create directories
sudo mkdir -p "$MOUNT_POINT/mongodb" "$MOUNT_POINT/mongodb-config" "$MOUNT_POINT/minio"
sudo chown -R 999:999 "$MOUNT_POINT/mongodb" "$MOUNT_POINT/mongodb-config"
sudo chown -R 1000:1000 "$MOUNT_POINT/minio"

echo "✅ Volume setup complete!"
echo ""
echo "📝 Update docker-compose.prod.yml to use mounted volumes:"
echo "   Uncomment the volumes sections for mongodb and minio"

