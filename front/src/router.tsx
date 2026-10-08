import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { GroupsPage } from '@/pages/groups-page'
import { MembersPage } from '@/pages/members-page'
import { NotFoundPage } from '@/pages/not-found-page'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, element: <Navigate to="/members" replace /> },
      { path: 'members', Component: MembersPage },
      { path: 'groups', Component: GroupsPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
