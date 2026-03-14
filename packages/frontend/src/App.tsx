import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import CreateFlow from "@/pages/CreateFlow";
import FlowList from "@/pages/FlowList";
import FlowDetail from "@/pages/FlowDetail";
import Templates from "@/pages/Templates";
import Deposits from "@/pages/Deposits";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/flows/create" element={<CreateFlow />} />
              <Route path="/flows" element={<FlowList />} />
              <Route path="/flows/:id" element={<FlowDetail />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/deposits" element={<Deposits />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
