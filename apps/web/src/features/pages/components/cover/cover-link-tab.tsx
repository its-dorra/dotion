import { useAppForm } from '@/integrations/tanstack-form/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface CoverLinkTabProps {
  onSelect: (url: string) => void
}

export function CoverLinkTab({ onSelect }: CoverLinkTabProps) {
  const form = useAppForm({
    defaultValues: {
      url: '',
    },
    onSubmit: async ({ value }) => {
      const trimmed = value.url.trim()
      if (trimmed) {
        onSelect(trimmed)
      }
    },
  })

  return (
    <div className="p-4 sm:p-6 focus-visible:outline-none">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
        className="space-y-4"
      >
        <form.Field
          name="url"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return 'Image URL is required'
              try {
                new URL(value.trim())
                return undefined
              } catch {
                return 'Please enter a valid URL'
              }
            },
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label
                htmlFor={field.name}
                className="text-xs font-medium text-muted-foreground"
              >
                Paste an image link from the web
              </Label>
              <div className="flex gap-2">
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="https://images.unsplash.com/..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="text-sm bg-muted/40"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!field.state.value.trim()}
                >
                  Submit
                </Button>
              </div>
              {field.state.meta.errors.length > 0 &&
              field.state.meta.isTouched ? (
                <p className="text-xs text-destructive">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>
        <p className="text-xs text-muted-foreground">
          Works with any direct image URL (JPEG, PNG, WebP, GIF) or Unsplash
          link.
        </p>
      </form>
    </div>
  )
}
