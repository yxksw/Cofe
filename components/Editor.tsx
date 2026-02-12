"use client";

import "katex/dist/katex.min.css";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ExternalDiscussion } from "discussing";

import { Button } from "@/components/ui/button";
import { CgImage } from "react-icons/cg";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { Textarea } from "@/components/ui/textarea";
import { createGitHubAPIClient } from "@/lib/client"
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { uploadImage } from "@/lib/githubApi";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Badge } from "@/components/ui/badge";

function removeFrontmatter(content: string): string {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  return content.replace(frontmatterRegex, "");
}

// Tag input component
function TagInput({
  tags,
  onChange,
  placeholder,
  disabled,
  suggestions = []
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
}) {
  const [inputValue, setInputValue] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`flex flex-wrap gap-2 p-2 border border-border rounded-md bg-background min-h-[42px] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <Badge
            key={index}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="ml-1 hover:text-destructive focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(e.target.value.length > 0 && filteredSuggestions.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0 && filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-w-md bg-popover border border-border rounded-md shadow-lg">
          {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        Press Enter or comma to add a tag
      </p>
    </div>
  );
}

// Category input component
function CategoryInput({
  categories,
  onChange,
  placeholder,
  disabled,
  suggestions = []
}: {
  categories: string[];
  onChange: (categories: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
}) {
  const [inputValue, setInputValue] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !categories.includes(s)
  );

  const addCategory = (category: string) => {
    const trimmedCategory = category.trim();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      onChange([...categories, trimmedCategory]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeCategory = (categoryToRemove: string) => {
    onChange(categories.filter(cat => cat !== categoryToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addCategory(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && categories.length > 0) {
      removeCategory(categories[categories.length - 1]);
    }
  };

  return (
    <div className="w-full relative">
      <div
        className={`flex flex-wrap gap-2 p-2 border border-border rounded-md bg-background min-h-[42px] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {categories.map((category, index) => (
          <Badge
            key={index}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {category}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCategory(category);
                }}
                className="ml-1 hover:text-destructive focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(e.target.value.length > 0 && filteredSuggestions.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0 && filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={categories.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-lg">
          {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addCategory(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        Press Enter or comma to add a category
      </p>
    </div>
  );
}

export default function Editor({
  defaultType = "memo",
}: {
  defaultType?: "memo" | "blog";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState(
    (searchParams.get("type") as "memo" | "blog") || defaultType
  );
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const t = useTranslations("HomePage");
  const { data: session } = useSession();
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const { toast } = useToast();
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [discussions, setDiscussions] = useState<ExternalDiscussion[]>([]);
  const { location, loading: locationLoading, requestLocation } = useGeolocation();
  const [postLocation, setPostLocation] = useState<{
    latitude?: number;
    longitude?: number;
    city?: string;
    street?: string;
  } | null>(null);
  const [isLocationAttached, setIsLocationAttached] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [isMemoLocationIgnored, setIsMemoLocationIgnored] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const fetchMemo = useCallback(
    async (id: string) => {
      if (!session?.accessToken) return;
      try {
        const memos = await createGitHubAPIClient(session.accessToken).getMemos()
        const memo = memos.find((t) => t.id === id);
        if (memo) {
          setContent(memo.content);
        }
      } catch (error) {
        console.error("Error fetching memo:", error);
      }
    },
    [session?.accessToken]
  );

  const fetchBlogPost = useCallback(
    async (id: string) => {
      if (!session?.accessToken) return;
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query GetBlogPost($id: String!) {
                blogPost(id: $id) {
                  id
                  title
                  content
                  status
                  latitude
                  longitude
                  city
                  street
                  tags
                  categories
                  discussions {
                    platform
                    url
                    title
                    count
                  }
                }
              }
            `,
            variables: { id },
          }),
        });

        const result = await response.json();
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const blogPost = result.data.blogPost;
        if (blogPost) {
          setTitle(blogPost.title);
          setContent(removeFrontmatter(blogPost.content));
          setDiscussions(blogPost.discussions || []);
          setEditingMemoId(id);
          setIsPublished(blogPost.status === 'published');
          setTags(blogPost.tags || []);
          setCategories(blogPost.categories || []);

          // Set existing location if available
          if (blogPost.latitude || blogPost.city) {
            setPostLocation({
              latitude: blogPost.latitude,
              longitude: blogPost.longitude,
              city: blogPost.city,
              street: blogPost.street
            });
            setIsLocationAttached(true);
          }
        }
      } catch (error) {
        console.error("Error fetching blog post:", error);
      }
    },
    [session?.accessToken]
  );

  // Fetch available tags and categories from existing posts
  const fetchAvailableTagsAndCategories = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetBlogPosts {
              blogPosts {
                tags
                categories
              }
            }
          `,
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const posts = result.data.blogPosts || [];
      const allTags = new Set<string>();
      const allCategories = new Set<string>();

      posts.forEach((post: { tags?: string[]; categories?: string[] }) => {
        post.tags?.forEach(tag => allTags.add(tag));
        post.categories?.forEach(cat => allCategories.add(cat));
      });

      setAvailableTags(Array.from(allTags).sort());
      setAvailableCategories(Array.from(allCategories).sort());
    } catch (error) {
      console.error("Error fetching available tags and categories:", error);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("type", type);
    router.push(`/editor?${params.toString()}`);

    const id = searchParams.get("id");

    if (id) {
      setEditingMemoId(id);
      if (type === "blog") {
        fetchBlogPost(id);
      } else if (type === "memo") {
        fetchMemo(id);
      }
    }

    // Fetch available tags and categories when in blog mode
    if (type === "blog") {
      fetchAvailableTagsAndCategories();
    }
  }, [type, router, searchParams, fetchMemo, fetchBlogPost, fetchAvailableTagsAndCategories]);

  const handleTypeChange = (value: "blog" | "memo") => {
    setType(value);
    // Clear content and state when switching modes
    setContent("");
    setTitle("");
    setEditingMemoId(null);
    setDiscussions([]);
    setPostLocation(null);
    setIsLocationAttached(false);
    setIsMemoLocationIgnored(false);
    setIsPublished(true);
    setTags([]);
    setCategories([]);

    // Navigate to clean URL without ID parameter
    router.push(`/editor?type=${value}`);

    // Fetch available tags and categories when switching to blog mode
    if (value === "blog") {
      fetchAvailableTagsAndCategories();
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSuccess(false);
    try {
      let query: string;
      let variables: Record<string, unknown>;

      if (type === "blog") {
        // Use unified saveBlogPost mutation for both create and update
        query = `
          mutation SaveBlogPost($id: String, $input: SaveBlogPostInput!) {
            saveBlogPost(id: $id, input: $input) {
              id
              title
              content
              status
              tags
              categories
            }
          }
        `;
        variables = {
          ...(editingMemoId && { id: editingMemoId }),
          input: {
            title,
            content,
            status: isPublished ? 'published' : 'draft',
            discussions,
            tags,
            categories,
            ...(isLocationAttached && postLocation && {
              latitude: postLocation.latitude,
              longitude: postLocation.longitude,
              city: postLocation.city,
              street: postLocation.street
            })
          },
        };
      } else {
        if (editingMemoId) {
          // Update memo
          query = `
            mutation UpdateMemo($id: String!, $input: UpdateMemoInput!) {
              updateMemo(id: $id, input: $input) {
                id
                content
                timestamp
              }
            }
          `;
          variables = {
            id: editingMemoId,
            input: {
              content,
            },
          };
        } else {
          // Create memo
          query = `
            mutation CreateMemo($input: CreateMemoInput!) {
              createMemo(input: $input) {
                id
                content
                timestamp
              }
            }
          `;
          variables = {
            input: {
              content,
              ...(location && {
                latitude: location.latitude,
                longitude: location.longitude,
                city: location.city,
                street: location.street
              })
            },
          };
        }
      }

      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      if (!response.ok) {
        throw new Error(t("failedPublish"));
      }

      setIsSuccess(true);
      toast({
        title: t("success"),
        description: editingMemoId
          ? `${type === "blog" ? t("blogPostUpdated") : t("memoUpdated")}`
          : `${type === "blog" ? (isPublished ? t("blogPostCreated") : "Draft saved") : t("memoCreated")}`,
        duration: 3000,
      });
      setTimeout(() => {
        if (type === "blog") {
          router.push("/blog");
        } else {
          router.push("/memos");
        }
      }, 2000);
    } catch (error) {
      console.error("Error publishing:", error);
      toast({
        title: t("error"),
        description: t("failedPublish"),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!session?.accessToken) {
        toast({
          title: t("error"),
          description: t("notAuthenticated"),
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      setIsImageUploading(true);
      try {
        const imageUrl = await uploadImage(file, session.accessToken);
        const imageMarkdown = `![${file.name}](${imageUrl})`;

        if (cursorPosition !== null) {
          const newContent =
            content.slice(0, cursorPosition) +
            imageMarkdown +
            content.slice(cursorPosition);
          setContent(newContent);
        } else {
          setContent((prevContent) => prevContent + "\n\n" + imageMarkdown);
        }

        toast({
          title: t("success"),
          description: t("imageUploaded"),
          duration: 3000,
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: t("error"),
          description: t("imageUploadFailed"),
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsImageUploading(false);
      }
    },
    [session?.accessToken, cursorPosition, content, toast, t]
  );

  const addDiscussion = () => {
    setDiscussions([...discussions, { platform: 'v2ex', url: '' }]);
  };

  const removeDiscussion = (index: number) => {
    setDiscussions(discussions.filter((_, i) => i !== index));
  };

  const updateDiscussion = (index: number, field: keyof ExternalDiscussion, value: string) => {
    const updated = discussions.map((discussion, i) => 
      i === index ? { ...discussion, [field]: value } : discussion
    );
    setDiscussions(updated);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        if (file.type.startsWith("image/")) {
          await handleImageUpload(file);
        } else {
          toast({
            title: t("error"),
            description: t("onlyImagesAllowed"),
            variant: "default",
            duration: 3000,
          });
        }
      }
    },
    [handleImageUpload, toast, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      "image/*": [],
    },
  });

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      if (!session?.accessToken) {
        toast({
          title: t("error"),
          description: t("notAuthenticated"),
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      const items = Array.from(e.clipboardData.items);
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          setIsImageUploading(true);

          try {
            const file = item.getAsFile();
            if (!file) continue;

            const imageUrl = await uploadImage(file, session.accessToken);
            const imageMarkdown = `![${
              file.name || "Pasted image"
            }](${imageUrl})`;

            if (cursorPosition !== null) {
              const newContent =
                content.slice(0, cursorPosition) +
                imageMarkdown +
                content.slice(cursorPosition);
              setContent(newContent);
            } else {
              setContent((prevContent) => prevContent + "\n\n" + imageMarkdown);
            }

            toast({
              title: t("success"),
              description: t("imageUploaded"),
              duration: 3000,
            });
          } catch (error) {
            console.error("Error uploading pasted image:", error);
            toast({
              title: t("error"),
              description: t("imageUploadFailed"),
              variant: "destructive",
              duration: 3000,
            });
          } finally {
            setIsImageUploading(false);
          }
        }
      }
    },
    [session?.accessToken, cursorPosition, content, toast, t]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {(isLoading || isImageUploading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-4 rounded-lg shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          </div>
        </div>
      )}
      
      {/* Header - Clean and minimal */}
      <div className="mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          {/* Draft/Published toggle on the left */}
          {type === "blog" && (
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPublished(false)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  !isPublished 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                disabled={isLoading || isImageUploading}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setIsPublished(true)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isPublished 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                disabled={isLoading || isImageUploading}
              >
                Published
              </button>
            </div>
          )}
          {type === "memo" && <div />} {/* Empty div to maintain justify-between spacing */}
          
          {/* Memo/Blog selector on the right */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 flex-wrap">
            <button
              type="button"
              onClick={() => handleTypeChange("memo")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                type === "memo" 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Memo
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("blog")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                type === "blog" 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Blog
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title Section - Clean and minimal */}
          {type === "blog" && (
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="title" className="text-sm font-medium text-foreground">
                    Title
                  </Label>
                </div>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a compelling title..."
                  required
                  className="text-lg font-medium border-border focus:border-primary focus:ring-primary bg-background"
                  disabled={isLoading || isImageUploading}
                />
              </div>

              {/* Tags Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-foreground">
                    Tags
                  </Label>
                </div>
                <TagInput
                  tags={tags}
                  onChange={setTags}
                  placeholder="Add tags..."
                  disabled={isLoading || isImageUploading}
                  suggestions={availableTags}
                />
              </div>

              {/* Categories Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-foreground">
                    Categories
                  </Label>
                </div>
                <CategoryInput
                  categories={categories}
                  onChange={setCategories}
                  placeholder="Add categories..."
                  disabled={isLoading || isImageUploading}
                  suggestions={availableCategories}
                />
              </div>
            </div>
          )}
          

          {/* Content Editor */}
          <div className="bg-card rounded-lg border border-border overflow-hidden" {...getRootProps()}>
            <input {...getInputProps()} />
            <div className="border-b border-border bg-muted/50">
              <div className="flex items-center justify-between px-4 flex-wrap gap-2">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setIsPreview(false)}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      !isPreview 
                        ? "text-primary border-b-2 border-primary bg-card" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    disabled={isLoading || isImageUploading}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreview(true)}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      isPreview 
                        ? "text-primary border-b-2 border-primary bg-card" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    disabled={isLoading || isImageUploading}
                  >
                    Preview
                  </button>
                </div>
                <label
                  htmlFor="image-upload"
                  className="p-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  title="Upload image"
                >
                  <CgImage className="h-5 w-5" />
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                    disabled={isLoading || isImageUploading}
                  />
                </label>
              </div>
            </div>
            {isPreview ? (
              <div className="p-6 prose prose-lg dark:prose-invert max-w-none min-h-[400px]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({
                      inline,
                      className,
                      children,
                      ...props
                    }: {
                      inline?: boolean;
                      className?: string;
                      children?: React.ReactNode;
                    } & React.HTMLAttributes<HTMLElement>) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={
                            tomorrow as { [key: string]: React.CSSProperties }
                          }
                          language={match[1]}
                          PreTag="div"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    a: ({ children, ...props }) => (
                      <a
                        {...props}
                        className="text-muted-foreground no-underline hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200 break-words"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    blockquote: ({ children }) => (
                      <div className="pl-4 border-l-4 border-border text-muted-foreground">{children}</div>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onSelect={(e) =>
                  setCursorPosition(e.currentTarget.selectionStart)
                }
                onPaste={handlePaste}
                placeholder={type === "blog" ? "Write your blog post content... (Markdown supported)" : "What's on your mind?"}
                className="min-h-[400px] p-6 border-0 focus:ring-0 resize-none bg-card"
                required
                disabled={isLoading || isImageUploading}
              />
            )}
            {isDragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/90 border-2 border-dashed border-primary rounded-lg">
                <div className="text-center">
                  <CgImage className="h-12 w-12 mx-auto text-primary mb-2" />
                  <p className="text-lg font-medium text-foreground">Drop image here</p>
                </div>
              </div>
            )}
          </div>

          {/* Location Section - Only show when location is attached */}
          {type === "blog" && isLocationAttached && postLocation && (
            <div className="bg-muted rounded-lg border border-border p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm text-foreground flex items-center gap-2 flex-wrap">
                  <span>📍</span>
                  <span>{postLocation.city}{postLocation.street ? ` · ${postLocation.street}` : ''}</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await requestLocation();
                      if (location) {
                        setPostLocation(location);
                        setIsLocationAttached(true);
                        toast({
                          title: "Location updated",
                          description: `${location.city}${location.street ? ` · ${location.street}` : ''}`,
                          duration: 3000,
                        });
                      }
                    }}
                    disabled={locationLoading}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {locationLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Update"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPostLocation(null);
                      setIsLocationAttached(false);
                      toast({
                        title: "Location removed",
                        duration: 2000,
                      });
                    }}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* External Discussions - Only show when discussions exist */}
          {type === "blog" && discussions.length > 0 && (
            <div className="bg-muted rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-sm font-medium text-foreground">
                  External Discussions ({discussions.length})
                </span>
              </div>
              <div className="space-y-2">
                {discussions.map((discussion, index) => (
                  <div key={index} className="flex gap-2 items-center flex-wrap">
                    <select
                      value={discussion.platform}
                      onChange={(e) => updateDiscussion(index, 'platform', e.target.value as ExternalDiscussion['platform'])}
                      className="px-2 py-1.5 border border-border rounded text-xs bg-card text-foreground"
                      disabled={isLoading || isImageUploading}
                    >
                      <option value="v2ex">V2EX</option>
                      <option value="reddit">Reddit</option>
                      <option value="hackernews">Hacker News</option>
                    </select>
                    <Input
                      type="url"
                      value={discussion.url}
                      onChange={(e) => updateDiscussion(index, 'url', e.target.value)}
                      placeholder="Paste discussion URL..."
                      className="flex-1 min-w-[150px] border-border text-xs h-8 bg-card"
                      disabled={isLoading || isImageUploading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDiscussion(index)}
                      disabled={isLoading || isImageUploading}
                      className="text-xs text-destructive hover:text-destructive h-8 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location for Memos - Only show when location is available and not ignored */}
          {type === "memo" && location && !isMemoLocationIgnored && (
            <div className="bg-muted rounded-lg border border-border p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm text-foreground flex items-center gap-2 flex-wrap">
                  <span>📍</span>
                  <span>{location.city}{location.street ? ` · ${location.street}` : ''}</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await requestLocation();
                      toast({
                        title: "Location updated",
                        description: location ? `${location.city}${location.street ? ` · ${location.street}` : ''}` : "Location refreshed",
                        duration: 3000,
                      });
                    }}
                    disabled={locationLoading}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {locationLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Update"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsMemoLocationIgnored(true);
                      toast({
                        title: "Location removed",
                        description: "Location will not be included with this memo",
                        duration: 2000,
                      });
                    }}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Add Location button for Blog posts when no location attached */}
              {type === "blog" && !isLocationAttached && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await requestLocation();
                    if (location) {
                      setPostLocation(location);
                      setIsLocationAttached(true);
                      toast({
                        title: "Location attached",
                        description: `${location.city}${location.street ? ` · ${location.street}` : ''}`,
                        duration: 3000,
                      });
                    }
                  }}
                  disabled={locationLoading}
                  className="flex items-center gap-2 text-sm flex-wrap"
                >
                  {locationLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span className="text-base">📍</span>
                  )}
                  Add Location
                </Button>
              )}
              {/* Add Location button for Memos when no location detected or location was ignored */}
              {type === "memo" && (!location || isMemoLocationIgnored) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setIsMemoLocationIgnored(false); // Un-ignore location
                    await requestLocation();
                    if (location) {
                      toast({
                        title: "Location detected",
                        description: `${location.city}${location.street ? ` · ${location.street}` : ''}`,
                        duration: 3000,
                      });
                    }
                  }}
                  disabled={locationLoading}
                  className="flex items-center gap-2 text-sm flex-wrap"
                >
                  {locationLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span className="text-base">📍</span>
                  )}
                  Add Location
                </Button>
              )}
              {/* Add Discussion Link for Blog posts */}
              {type === "blog" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDiscussion}
                  disabled={isLoading || isImageUploading}
                  className="text-sm flex-wrap"
                >
                  + Add Discussion Link
                </Button>
              )}
              {isSuccess && (
                <span className="text-sm text-green-600 flex items-center gap-2 flex-wrap">
                  <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                  {t("successPublished")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(type === "blog" ? "/blog" : "/memos")}
                disabled={isLoading || isImageUploading}
                className="px-4 flex-wrap"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading || isImageUploading || (!content || (type === "blog" && !title))}
                className="px-4 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 flex-wrap"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    {editingMemoId ? "Update" : "Save"}
                    {type === "blog" ? " Post" : " Memo"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
    </div>
  );
}
