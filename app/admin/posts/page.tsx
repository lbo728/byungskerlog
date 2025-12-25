"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, Trash2, Plus, X, BookOpen, Check, BarChart3, TrendingUp, Eye } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Post {
  id: string;
  slug: string;
  subSlug: string | null;
  title: string;
  excerpt: string | null;
  tags: string[];
  type: "LONG" | "SHORT";
  published: boolean;
  createdAt: string;
  updatedAt: string;
  totalViews?: number;
  dailyViews?: number;
}

interface Series {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { posts: number };
}

export default function AdminPostsPage() {
  useUser({ or: "redirect" });
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Series states
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [editingSeriesName, setEditingSeriesName] = useState("");
  const [newSeriesName, setNewSeriesName] = useState("");
  const [isAddingSeries, setIsAddingSeries] = useState(false);
  const [deleteSeriesDialogOpen, setDeleteSeriesDialogOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<Series | null>(null);
  const [isDeletingSeries, setIsDeletingSeries] = useState(false);

  // Filter states
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("desc");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Analytics states
  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [analyticsData, setAnalyticsData] = useState<{ date: string; views: number }[]>([]);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build query params
      const params = new URLSearchParams({
        limit: "100",
        includeUnpublished: "true",
        sortBy,
      });

      if (selectedTag && selectedTag !== "all") {
        params.append("tag", selectedTag);
      }

      if (selectedType && selectedType !== "all") {
        params.append("type", selectedType);
      }

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      const response = await fetch(`/api/posts?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data.posts);

      // Extract unique tags
      const tags = new Set<string>();
      data.posts.forEach((post: Post) => {
        post.tags.forEach((tag: string) => tags.add(tag));
      });
      setAvailableTags(Array.from(tags).sort());
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("글 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTag, selectedType, sortBy, startDate, endDate]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleResetFilters = () => {
    setSelectedTag("all");
    setSelectedType("all");
    setSortBy("desc");
    setStartDate("");
    setEndDate("");
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/posts/${postToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      toast.success("글이 삭제되었습니다.");
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      fetchPosts();
      router.refresh();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("글 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Series functions
  const fetchSeries = useCallback(async () => {
    try {
      setIsLoadingSeries(true);
      const response = await fetch("/api/series");
      if (!response.ok) throw new Error("Failed to fetch series");
      const data = await response.json();
      setSeriesList(data);
    } catch (error) {
      console.error("Error fetching series:", error);
      toast.error("시리즈 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingSeries(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "series") {
      fetchSeries();
    }
  }, [activeTab, fetchSeries]);

  const handleAddSeries = async () => {
    if (!newSeriesName.trim()) return;

    try {
      setIsAddingSeries(true);
      const slug = newSeriesName
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .replace(/^-|-$/g, "");

      const response = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSeriesName, slug }),
      });

      if (!response.ok) throw new Error("Failed to create series");

      toast.success("시리즈가 생성되었습니다.");
      setNewSeriesName("");
      fetchSeries();
    } catch (error) {
      console.error("Error creating series:", error);
      toast.error("시리즈 생성에 실패했습니다.");
    } finally {
      setIsAddingSeries(false);
    }
  };

  const handleUpdateSeries = async (id: string) => {
    if (!editingSeriesName.trim()) return;

    try {
      const slug = editingSeriesName
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .replace(/^-|-$/g, "");

      const response = await fetch(`/api/series/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingSeriesName, slug }),
      });

      if (!response.ok) throw new Error("Failed to update series");

      toast.success("시리즈가 수정되었습니다.");
      setEditingSeriesId(null);
      setEditingSeriesName("");
      fetchSeries();
    } catch (error) {
      console.error("Error updating series:", error);
      toast.error("시리즈 수정에 실패했습니다.");
    }
  };

  const handleDeleteSeriesClick = (series: Series) => {
    setSeriesToDelete(series);
    setDeleteSeriesDialogOpen(true);
  };

  const handleDeleteSeriesConfirm = async () => {
    if (!seriesToDelete) return;

    try {
      setIsDeletingSeries(true);
      const response = await fetch(`/api/series/${seriesToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete series");

      toast.success("시리즈가 삭제되었습니다.");
      setDeleteSeriesDialogOpen(false);
      setSeriesToDelete(null);
      fetchSeries();
    } catch (error) {
      console.error("Error deleting series:", error);
      toast.error("시리즈 삭제에 실패했습니다.");
    } finally {
      setIsDeletingSeries(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              나가기
            </Button>
            <h1 className="text-lg font-semibold">관리</h1>
          </div>
          <Button variant="default" size="sm" onClick={() => router.push("/admin/write")} className="gap-2">
            <Plus className="h-4 w-4" />새 글 작성
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-12 bg-transparent border-0 p-0">
              <TabsTrigger
                value="posts"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                글 관리
              </TabsTrigger>
              <TabsTrigger
                value="series"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                시리즈 관리
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                분석
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Posts Tab Content */}
      {activeTab === "posts" && (
        <>
          {/* Filters */}
          <div className="border-b border-border bg-muted/30">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">태그</label>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="모든 태그" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 태그</SelectItem>
                      {availableTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">유형</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="모든 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 유형</SelectItem>
                      <SelectItem value="LONG">Long</SelectItem>
                      <SelectItem value="SHORT">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">정렬</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">최신순</SelectItem>
                      <SelectItem value="asc">오래된순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">시작일</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">종료일</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    초기화
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Content */}
          <div className="container mx-auto px-4 py-8">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">작성된 글이 없습니다.</p>
                <Button onClick={() => router.push("/admin/write")}>첫 글 작성하기</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="post-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="post-card-content flex-1 min-w-0">
                        <div className="post-card-header flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="text-lg sm:text-xl font-semibold truncate max-w-full">{post.title}</h2>
                          {post.type === "SHORT" && (
                            <span className="px-2 py-0.5 text-xs bg-violet-500/10 text-violet-500 rounded">Short</span>
                          )}
                          {!post.published && (
                            <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">비공개</span>
                          )}
                        </div>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                        )}
                        <div className="post-card-meta flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                          <span>{formatDate(post.createdAt)}</span>
                          <span className="px-2 py-0.5 bg-muted rounded whitespace-nowrap">
                            일간 {post.dailyViews || 0} / 총 {post.totalViews || 0}
                          </span>
                        </div>
                        <div className="post-card-slugs flex flex-wrap items-center gap-2 mt-2 text-xs">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded font-mono">
                            /{post.slug}
                          </span>
                          {post.subSlug && (
                            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded font-mono">
                              /{post.subSlug}
                            </span>
                          )}
                        </div>
                        {post.tags.length > 0 && (
                          <div className="post-card-tags flex flex-wrap gap-1.5 mt-2">
                            {post.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="post-card-actions flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/posts/${post.slug}`)}>
                          보기
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/write?id=${post.id}`)}
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(post)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Series Tab Content */}
      {activeTab === "series" && (
        <div className="container mx-auto px-4 py-8">
          {/* Add New Series */}
          <div className="add-series-form flex gap-2 mb-8">
            <Input
              placeholder="새 시리즈 이름"
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSeries()}
              className="max-w-sm"
            />
            <Button onClick={handleAddSeries} disabled={isAddingSeries || !newSeriesName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </div>

          {/* Series List */}
          {isLoadingSeries ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : seriesList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">등록된 시리즈가 없습니다.</p>
            </div>
          ) : (
            <div className="series-list space-y-4">
              {seriesList.map((series) => (
                <div
                  key={series.id}
                  className="series-item border border-border rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  {editingSeriesId === series.id ? (
                    <div className="edit-form flex-1 flex items-center gap-2">
                      <Input
                        value={editingSeriesName}
                        onChange={(e) => setEditingSeriesName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateSeries(series.id)}
                        className="max-w-sm"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleUpdateSeries(series.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSeriesId(null);
                          setEditingSeriesName("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="series-info flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-emerald-500" />
                        <div>
                          <h3 className="font-medium">{series.name}</h3>
                          <p className="text-sm text-muted-foreground">{series._count.posts}개의 포스트</p>
                        </div>
                      </div>
                      <div className="series-actions flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSeriesId(series.id);
                            setEditingSeriesName(series.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSeriesClick(series)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab Content */}
      {activeTab === "analytics" && (
        <div className="container mx-auto px-4 py-8">
          <div className="analytics-grid grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top 5 by Views */}
            <section className="analytics-top-views">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">조회수 TOP 5</h2>
              </div>
              <div className="space-y-3">
                {posts
                  .filter((p) => p.published)
                  .sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))
                  .slice(0, 5)
                  .map((post, index) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/posts/${post.slug}`)}
                    >
                      <span className="text-2xl font-bold text-muted-foreground w-8">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{post.title}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <TrendingUp className="h-4 w-4" />
                        {post.totalViews || 0}
                      </div>
                    </div>
                  ))}
                {posts.filter((p) => p.published).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">게시된 포스트가 없습니다.</p>
                )}
              </div>
            </section>

            {/* Daily Views Chart */}
            <section className="analytics-chart">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">조회수 추이</h2>
                </div>
                <Select value={chartPeriod} onValueChange={(v) => setChartPeriod(v as typeof chartPeriod)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">일별</SelectItem>
                    <SelectItem value="weekly">주간별</SelectItem>
                    <SelectItem value="monthly">월별</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="chart-container h-[300px] border border-border rounded-lg p-4">
                {analyticsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    조회수 데이터가 없습니다.
                  </div>
                )}
              </div>
            </section>

            {/* Summary Stats */}
            <section className="analytics-summary lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4">전체 통계</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="stat-card p-4 border border-border rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">
                    {posts.filter((p) => p.published).length}
                  </p>
                  <p className="text-sm text-muted-foreground">게시된 글</p>
                </div>
                <div className="stat-card p-4 border border-border rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">
                    {posts.filter((p) => !p.published).length}
                  </p>
                  <p className="text-sm text-muted-foreground">비공개 글</p>
                </div>
                <div className="stat-card p-4 border border-border rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">
                    {posts.reduce((sum, p) => sum + (p.totalViews || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">총 조회수</p>
                </div>
                <div className="stat-card p-4 border border-border rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">
                    {posts.reduce((sum, p) => sum + (p.dailyViews || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">오늘 조회수</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{postToDelete?.title}&rdquo; 글이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Series Confirmation Dialog */}
      <AlertDialog open={deleteSeriesDialogOpen} onOpenChange={setDeleteSeriesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시리즈를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{seriesToDelete?.name}&rdquo; 시리즈가 삭제됩니다. 해당 시리즈에 속한 포스트는 삭제되지 않고
              무분류로 변경됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSeries}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeriesConfirm}
              disabled={isDeletingSeries}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingSeries ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
