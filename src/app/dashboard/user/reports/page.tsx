"use client";

import { useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/dashboardLayout";
import {
  FileText,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";

export default function AllReportsPage() {
  const {
    allReports,
    filteredReports,
    loading,
    searchQuery,
    filterStatus,
    filterCategory,
    setSearchQuery,
    setFilterStatus,
    setFilterCategory,
    fetchAllReports,
  } = useUserStore();

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      WET: "emerald",
      DRY: "blue",
      MIXED: "amber",
      HAZARDOUS: "red",
      OTHER: "slate",
    };
    return colors[category] || "slate";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-amber-400" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <DashboardLayout role="user">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">All Reports</h1>
            <p className="text-slate-400 text-lg">
              View and track all your waste reports
            </p>
          </div>
          <Link
            href="/dashboard/user/report"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <FileText className="w-5 h-5" />
            <span>New Report</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Reports</span>
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">{allReports.length}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Verified</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {allReports.filter((r) => r.status === "VERIFIED").length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Pending</span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {allReports.filter((r) => r.status === "PENDING").length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Rejected</span>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {allReports.filter((r) => r.status === "REJECTED").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="WET">Wet Waste</option>
                <option value="DRY">Dry Waste</option>
                <option value="MIXED">Mixed Waste</option>
                <option value="HAZARDOUS">Hazardous</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {filteredReports.length} Report
              {filteredReports.length !== 1 ? "s" : ""}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No reports found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const color = getCategoryColor(report.category);
                return (
                  <Link
                    key={report.id}
                    href={`/dashboard/user/reports/${report.id}`}
                    className="group block bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-xl p-5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-3 bg-${color}-500/10 rounded-lg`}>
                          {getStatusIcon(report.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-white font-semibold text-lg capitalize">
                              {report.category.toLowerCase()} Waste
                            </p>
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                report.status === "VERIFIED"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : report.status === "PENDING"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(report.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-500">
                              ID: {report.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
