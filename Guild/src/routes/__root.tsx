import { Outlet, createRootRoute } from '@tanstack/react-router'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Navbar/>
      <Outlet />
      <Footer/>
    </>
  )
}
