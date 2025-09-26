import { createBrowserRouter } from "react-router-dom";
import Layout from "./pages/Layout";
import ErrorPage from "./pages/ErrorPage";
import MapPage from "./pages/MapPage";
import InputPage from "./pages/InputPage";
import LogPage from "./pages/LogPage";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout/>,
        errorElement: <ErrorPage/>,
        children: [
            {index: true, element: <InputPage/>},
            {path: '/map', element: <MapPage />},
            {path: '/log', element: <LogPage />},
        ]
    }
])

export default router;