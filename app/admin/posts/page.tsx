"use client";

import { useState, useMemo } from "react";
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
import type { Post, Series } from "@/lib/types/post";
import { SlugEditModal } from "@/components/modals/slug-edit-modal";
import { useAdminPosts } from "@/hooks/useAdminPosts";
import { useSeries } from "@/hooks/useSeries";
import { useDeletePost } from "@/hooks/usePostMutations";
import { useCreateSeries, useUpdateSeries, useDeleteSeries } from "@/hooks/useSeriesMutations";
import type { AdminPostsFilters } from "@/lib/queryKeys";

export default function AdminPostsPage() {
  useUser({ or: "redirect" });
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("posts");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [slugEditModalOpen, setSlugEditModalOpen] = useState(false);
  const [postToEditSlug, setPostToEditSlug] = useState<Post | null>(null);

  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [editingSeriesName, setEditingSeriesName] = useState("");
  const [newSeriesName, setNewSeriesName] = useState("");
  const [deleteSeriesDialogOpen, setDeleteSeriesDialogOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<Series | null>(null);

  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("desc");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [analyticsData] = useState<{ date: string; views: number }[]>([]);

  const filters: AdminPostsFilters = useMemo(
    () => ({
      tag: selectedTag !== "all" ? selectedTag : undefined,
      type: selectedType !== "all" ? selectedType : undefined,
      sortBy,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [selectedTag, selectedType, sortBy, startDate, endDate]
  );

  const { data: postsData, isLoading: isLoadingPosts } = useAdminPosts({ filters });
  const { data: seriesList = [], isLoading: isLoadingSeries } = useSeries({
    enabled: activeTab === "series",
  });

  const deletePostMutation = useDeletePost();
  const createSeriesMutation = useCreateSeries();
  const updateSeriesMutation = useUpdateSeries();
  const deleteSeriesMutation = useDeleteSeries();

  const posts = useMemo(() => postsData?.posts ?? [], [postsData?.posts]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => {
      post.tags.forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [posts]);

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleSlugEditClick = (post: Post) => {
    setPostToEditSlug(post);
    setSlugEditModalOpen(true);
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
      await deletePostMutation.mutateAsync(postToDelete.id);
      toast.success("글이 삭제되었습니다.");
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      router.refresh();
    } catch {
      toast.error("글 삭제 중 오류가 발생했습니다.");
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleAddSeries = async () => {
    if (!newSeriesName.trim()) return;

    try {
      const slug = newSeriesName
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .replace(/^-|-$/g, "");

      await createSeriesMutation.mutateAsync({ name: newSeriesName, slug });
      toast.success("시리즈가 생성되었습니다.");
      setNewSeriesName("");
    } catch {
      toast.error("시리즈 생성에 실패했습니다.");
    }
  };

  const handleUpdateSeries = async (id: string) => {
    if (!editingSeriesName.trim()) return;

    try {
      const slug = editingSeriesName
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .replace(/^-|-$/g, "");

      await updateSeriesMutation.mutateAsync({ id, name: editingSeriesName, slug });
      toast.success("시리즈가 수정되었습니다.");
      setEditingSeriesId(null);
      setEditingSeriesName("");
    } catch {
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
      await deleteSeriesMutation.mutateAsync(seriesToDelete.id);
      toast.success("시리즈가 삭제되었습니다.");
      setDeleteSeriesDialogOpen(false);
      setSeriesToDelete(null);
    } catch {
      toast.error("시리즈 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="admin-posts-page min-h-screen bg-background">
      <header className="admin-header sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
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

      <div className="admin-tabs border-b border-border">
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

      {activeTab === "posts" && (
        <>
          <div className="posts-filters border-b border-border bg-muted/30">
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

          <div className="posts-content container mx-auto px-4 py-8">
            {isLoadingPosts ? (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSlugEditClick(post);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="text-xs">변경</span>
                          </Button>
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

      {activeTab === "series" && (
        <div className="series-content container mx-auto px-4 py-8">
          <div className="add-series-form flex gap-2 mb-8">
            <Input
              placeholder="새 시리즈 이름"
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSeries()}
              className="max-w-sm"
            />
            <Button
              onClick={handleAddSeries}
              disabled={createSeriesMutation.isPending || !newSeriesName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </div>

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
                      <Button
                        size="sm"
                        onClick={() => handleUpdateSeries(series.id)}
                        disabled={updateSeriesMutation.isPending}
                      >
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
                          <p className="text-sm text-muted-foreground">{series._count?.posts ?? 0}개의 포스트</p>
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

      {activeTab === "analytics" && (
        <div className="analytics-content container mx-auto px-4 py-8">
          <div className="analytics-grid grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                      className="analytics-item flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{postToDelete?.title}&rdquo; 글이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePostMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletePostMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePostMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogCancel disabled={deleteSeriesMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeriesConfirm}
              disabled={deleteSeriesMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSeriesMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {postToEditSlug && (
        <SlugEditModal
          open={slugEditModalOpen}
          onOpenChange={setSlugEditModalOpen}
          postId={postToEditSlug.id}
          currentSlug={postToEditSlug.slug}
          currentSubSlug={postToEditSlug.subSlug || null}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
