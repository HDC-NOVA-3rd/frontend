import React, { useEffect, useMemo, useState } from "react";
import { getComplaintsByApartment } from "../../services/complaintApi";

export default function ComplaintStatistics() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getComplaintsByApartment();
        setList(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e?.message || "민원 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    // status/type/createdAt/updatedAt 기반 집계 (일단 기본만)
    const byStatus = {};
    const byType = {};
    let completedCount = 0;
    let totalProcessMs = 0;

    for (const c of list) {
      const status = c.status || "UNKNOWN";
      const type = c.type || "UNKNOWN";

      byStatus[status] = (byStatus[status] || 0) + 1;
      byType[type] = (byType[type] || 0) + 1;

      if (status === "COMPLETED" && c.createdAt && c.updatedAt) {
        const ms = new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime();
        if (Number.isFinite(ms) && ms >= 0) {
          completedCount += 1;
          totalProcessMs += ms;
        }
      }
    }

    const avgHours = completedCount > 0 ? totalProcessMs / completedCount / (1000 * 60 * 60) : 0;

    return {
      total: list.length,
      byStatus,
      byType,
      avgHours,
    };
  }, [list]);

  if (loading) return <div style={{ padding: 20 }}>로딩중...</div>;
  if (err) return <div style={{ padding: 20, color: "red" }}>{err}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>민원 통계</h2>

      {/* KPI */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <Kpi title="총 민원" value={stats.total} />
        <Kpi title="접수" value={stats.byStatus.RECEIVED || 0} />
        <Kpi title="배정" value={stats.byStatus.ASSIGNED || 0} />
        <Kpi title="처리중" value={stats.byStatus.IN_PROGRESS || 0} />
        <Kpi title="완료" value={stats.byStatus.COMPLETED || 0} />
        <Kpi title="평균 처리시간(시간)" value={stats.avgHours.toFixed(1)} />
      </div>

      {/* 여기 아래에 차트 붙이면 됨 */}
      <pre style={{ marginTop: 16, background: "#f6f6f6", padding: 12 }}>
        {JSON.stringify({ byStatus: stats.byStatus, byType: stats.byType }, null, 2)}
      </pre>
    </div>
  );
}

function Kpi({ title, value }) {
  return (
    <div style={{ minWidth: 140, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
