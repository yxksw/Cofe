"use client";

import { BlogPost } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

export const BlogCard = ({ post }: { post: BlogPost }) => (
  <div className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-200">
    {post.imageUrl && (
      <a
        href={post.imageUrl}
        data-fancybox="blog-gallery"
        data-caption={post.title}
        className="block h-48 bg-muted relative overflow-hidden cursor-zoom-in"
      >
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </a>
    )}
    <Link
      href={`/blog/${encodeURIComponent(post.id)}`}
      className="block p-6 h-full flex flex-col justify-between"
      aria-label={post.title}
    >
      <div className="space-y-4">
        <h3 className="font-semibold text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors duration-200 leading-tight">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {formatDate(post.date)}
        </p>
      </div>
    </Link>
  </div>
);

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
}
