import { useState, useEffect } from 'react';
import { getSignedUrl } from '@/lib/storageUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface SignedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  bucket: string;
  storagePath: string;
}

export const SignedImage = ({ bucket, storagePath, className, alt, ...props }: SignedImageProps) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSignedUrl(bucket, storagePath).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => { cancelled = true; };
  }, [bucket, storagePath]);

  if (!src) return <Skeleton className={className} />;
  return <img src={src} alt={alt || ''} className={className} {...props} />;
};
