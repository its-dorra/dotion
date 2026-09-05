import { useInfiniteQuery } from '@tanstack/react-query'
import { notificationsInfiniteQueryOptions } from '../query-options'
import { NotificationsListPresenter } from './notifications-list-presenter'
import { NotificationsLoading } from './notifications-loading'
import { NotificationsError } from './notifications-error'
import { NotificationsEmpty } from './notifications-empty'

export function NotificationsContainer() {
  const query = useInfiniteQuery(notificationsInfiniteQueryOptions())

  if (query.isPending) {
    return <NotificationsLoading />
  }

  if (query.isError) {
    return (
      <NotificationsError
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    )
  }

  const notifications = query.data.pages.flatMap((page) => page.payload)

  if (notifications.length === 0) {
    return <NotificationsEmpty />
  }

  return (
    <NotificationsListPresenter
      notifications={notifications}
      hasNextPage={query.hasNextPage}
      fetchNextPage={query.fetchNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
    />
  )
}
