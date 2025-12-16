import { ChevronLeft, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CollapsedSidebarProps {
  filesCount: number;
  onExpand: () => void;
  onRefresh: () => void;
}

export function CollapsedSidebar({
  filesCount,
  onExpand,
  onRefresh,
}: CollapsedSidebarProps) {
  return (
    <Card className="h-full flex flex-col items-center py-3 sm:py-4 bg-muted/50">
      <Button
        variant="ghost"
        size="icon"
        onClick={onExpand}
        aria-label="Expand sidebar"
        className="mb-2 sm:mb-4 h-8 w-8 sm:h-9 sm:w-9"
      >
        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
      <div className="flex-1 flex flex-col items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          aria-label="Refresh files"
          title="Refresh files"
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="border-t w-6 sm:w-8" />
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            aria-label="Files"
            title="View files"
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          {filesCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[8px]"
            >
              {filesCount}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
