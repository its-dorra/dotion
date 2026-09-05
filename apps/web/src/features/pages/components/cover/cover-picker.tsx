import { useState } from 'react'
import { Trash2, Link as LinkIcon, Sparkles, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIsMobile } from '@/hooks/use-mobile'
import { CoverUnsplashTab } from './cover-unsplash-tab'
import { CoverGalleryTab } from './cover-gallery-tab'
import { CoverLinkTab } from './cover-link-tab'

interface CoverPickerDialogProps {
  cover?: string | null
  onSelect: (url: string | null) => void
  children: React.ReactNode
}

export function CoverPicker({
  cover,
  onSelect,
  children,
}: CoverPickerDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'unsplash' | 'gallery' | 'link'>(
    'unsplash',
  )
  const isMobile = useIsMobile()

  function handleSelect(url: string | null) {
    onSelect(url)
    setOpen(false)
  }

  const tabsElement = (
    <Tabs
      value={activeTab}
      onValueChange={(val) =>
        setActiveTab(val as 'unsplash' | 'gallery' | 'link')
      }
      className="w-full flex flex-col min-h-0 flex-1"
    >
      <div className="border-b px-4 sm:px-6 bg-muted/20 shrink-0">
        <TabsList className="h-9 gap-2 bg-transparent p-0">
          <TabsTrigger
            value="unsplash"
            className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 mr-1.5" />
            Unsplash
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Gallery
          </TabsTrigger>
          <TabsTrigger
            value="link"
            className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer"
          >
            <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
            Link
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="unsplash"
        className="p-0 m-0 focus-visible:outline-none flex-1 overflow-hidden"
      >
        <CoverUnsplashTab cover={cover} onSelect={handleSelect} />
      </TabsContent>

      <TabsContent
        value="gallery"
        className="p-0 m-0 focus-visible:outline-none flex-1 overflow-hidden"
      >
        <CoverGalleryTab cover={cover} onSelect={handleSelect} />
      </TabsContent>

      <TabsContent
        value="link"
        className="p-0 m-0 focus-visible:outline-none flex-1 overflow-hidden"
      >
        <CoverLinkTab onSelect={handleSelect} />
      </TabsContent>
    </Tabs>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="p-0 overflow-hidden rounded-t-2xl max-h-[85vh] flex flex-col gap-0 border-t"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-semibold">
                Cover Image
              </SheetTitle>
              {cover ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-destructive/80 hover:text-destructive hover:bg-destructive/10 text-xs h-7 px-2 cursor-pointer"
                  onClick={() => handleSelect(null)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove cover
                </Button>
              ) : null}
            </div>
          </SheetHeader>
          {tabsElement}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden sm:rounded-xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              Cover Image
            </DialogTitle>
            {cover ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-destructive/80 hover:text-destructive hover:bg-destructive/10 text-xs h-7 px-2 cursor-pointer"
                onClick={() => handleSelect(null)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove cover
              </Button>
            ) : null}
          </div>
        </DialogHeader>
        {tabsElement}
      </DialogContent>
    </Dialog>
  )
}
