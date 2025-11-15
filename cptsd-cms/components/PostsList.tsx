import Link from 'next/link';

type Post = {
  id: string;
  postType: string;
  status: string;
  rawIdea: string;
  finchScreenshotUrl: string | null;
  aiBackgroundUrls: any;
  createdAt: Date;
  topic: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type PostsListProps = {
  posts: Post[];
};

export default function PostsList({ posts }: PostsListProps) {
  if (posts.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No posts found. Create your first post to get started.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'GENERATED':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'POSTED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPostTypeColor = (postType: string) => {
    switch (postType) {
      case 'CAROUSEL':
        return 'bg-orange-100 text-orange-800';
      case 'REEL':
        return 'bg-pink-100 text-pink-800';
      case 'STORY':
        return 'bg-yellow-100 text-yellow-800';
      case 'MEME':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getThumbnailUrl = (post: Post) => {
    if (post.finchScreenshotUrl) {
      return post.finchScreenshotUrl;
    }
    if (post.aiBackgroundUrls && Array.isArray(post.aiBackgroundUrls) && post.aiBackgroundUrls.length > 0) {
      return post.aiBackgroundUrls[0];
    }
    return null;
  };

  return (
    <div className="card">
      <div className="grid grid-cols-1 gap-4">
        {posts.map((post) => {
          const thumbnailUrl = getThumbnailUrl(post);
          
          return (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-4">
                {thumbnailUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={thumbnailUrl}
                      alt="Post thumbnail"
                      className="w-24 h-24 object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPostTypeColor(post.postType)}`}>
                      {post.postType}
                    </span>
                    {post.topic && (
                      <span className="text-sm text-gray-500">{post.topic.name}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">{post.rawIdea}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

