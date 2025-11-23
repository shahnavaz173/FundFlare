// pages/StatementViewerPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Button,
  TextField,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

import { Document, Page, pdfjs } from "react-pdf";

// IMPORTANT: worker version must match pdfjs version
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export default function StatementViewerPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { id } = useParams();

  const location = useLocation();
  const pdfResult = location.state?.pdfResult || null;

  const [objectUrl, setObjectUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [page, setPage] = useState(1);
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [renderError, setRenderError] = useState(null);

  const contentRef = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(800);

  const documentOptions = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    }),
    []
  );

  // Create / revoke blob URL
  useEffect(() => {
    if (pdfResult && pdfResult.blob) {
      const url = URL.createObjectURL(pdfResult.blob);
      setObjectUrl(url);
      return () => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
        setObjectUrl(null);
      };
    } else {
      setObjectUrl(null);
    }
  }, [pdfResult]);

  // Measure available width of the content area (exact)
  useEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;

    const update = () => {
      try {
        const rect = el.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        setAvailableWidth(Math.max(200, width));
      } catch {
        setAvailableWidth(Math.max(200, window.innerWidth));
      }
    };

    update();

    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    } else {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
  }, []);

  // Reset when file changes
  useEffect(() => {
    setPage(1);
    setNumPages(null);
    setZoomMultiplier(1);
    setRenderError(null);
  }, [objectUrl]);

  const handleBack = () => {
    if (id) {
      navigate(`/dashboard/accounts/${id}`);
    } else {
      navigate(-1);
    }
  };

  const handleDownload = () => {
    if (!pdfResult?.blob) return;
    try {
      const url = objectUrl || URL.createObjectURL(pdfResult.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfResult.filename || "statement.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (!objectUrl) URL.revokeObjectURL(url);
    } catch {
      if (objectUrl) window.open(objectUrl, "_blank");
    }
  };

  const onDocumentLoadSuccess = ({ numPages: np }) => {
    setNumPages(np);
    setPage((p) => (p > np ? np : p < 1 ? 1 : p));
    setRenderError(null);
  };

  const onDocumentLoadError = (err) => {
    console.error("PDF render error:", err);
    setRenderError(err?.message || "Failed to render PDF");
  };

  const zoomIn = () =>
    setZoomMultiplier((s) => Math.min(3, +(s + 0.2).toFixed(2)));
  const zoomOut = () =>
    setZoomMultiplier((s) => Math.max(0.6, +(s - 0.2).toFixed(2)));
  const fitWidth = () => setZoomMultiplier(1);

  const goPrev = () =>
    setPage((p) => {
      const np = numPages || 1;
      return Math.max(1, Math.min(np, p - 1));
    });

  const goNext = () =>
    setPage((p) => {
      const np = numPages || 1;
      return Math.max(1, Math.min(np, p + 1));
    });

  // Page width: never exceed availableWidth, so no horizontal overflow
  const rawWidth = Math.round(availableWidth * zoomMultiplier);
  const pageRenderWidth = Math.min(rawWidth, availableWidth);

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setPage(1);
      return;
    }
    const v = Number(value);
    if (isNaN(v)) return;
    const np = numPages || 1;
    const clamped = Math.max(1, Math.min(np, v));
    setPage(clamped);
  };

  // If user opens this URL directly without state
  if (!pdfResult) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f6f8",
          width: "100%",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          No statement data found.
        </Typography>
        <Button variant="contained" onClick={handleBack}>
          Go back
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f5f6f8",
        width: "100%",
        overflowX: "hidden", // no horizontal scroll for this page
      }}
    >
      {/* Top bar of viewer */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "#ffffff",
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1,
        }}
      >
        {/* Left section: back + title (+ optional filename) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
          }}
        >
          <IconButton onClick={handleBack} size="small">
            <ArrowBackIcon />
          </IconButton>

          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{ fontWeight: 600 }}
          >
            View Statement
          </Typography>

          {!isMobile && (
            <Typography
              variant="body2"
              sx={{ ml: 2, color: "text.secondary" }}
              noWrap
            >
              {pdfResult.filename || ""}
            </Typography>
          )}
        </Box>

        {/* Right section: controls + page number */}
        <Box
          sx={{
            ml: { xs: 0, sm: "auto" },
            mt: { xs: 0.5, sm: 0 },
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            gap: 0.5,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Tooltip title="Download">
            <IconButton onClick={handleDownload} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Zoom out">
            <IconButton onClick={zoomOut} size="small">
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Fit width">
            <IconButton onClick={fitWidth} size="small">
              <FitScreenIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Zoom in">
            <IconButton onClick={zoomIn} size="small">
              <ZoomInIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Previous page">
            <IconButton
              onClick={goPrev}
              size="small"
              disabled={!numPages || page <= 1}
            >
              <NavigateBeforeIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Next page">
            <IconButton
              onClick={goNext}
              size="small"
              disabled={!numPages || page >= (numPages || 1)}
            >
              <NavigateNextIcon />
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <TextField
              size="small"
              type="number"
              value={page}
              onChange={handlePageInputChange}
              inputProps={{
                style: { width: 56, textAlign: "center" },
                min: 1,
              }}
            />
            <Typography variant="body2">/ {numPages || "-"}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Content area */}
      <Box
        ref={contentRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden", // no horizontal scroll here either
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          py: 2,
          px: { xs: 1, sm: 2 },
          boxSizing: "border-box",
        }}
      >
        {!objectUrl && (
          <Box sx={{ textAlign: "center", p: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Preparing preview...
            </Typography>
            <CircularProgress />
          </Box>
        )}

        {objectUrl && !renderError && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Document
              key={objectUrl}
              file={objectUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<CircularProgress />}
              error={null}
              options={documentOptions}
            >
              <Box
                sx={{
                  width: pageRenderWidth,
                  maxWidth: "100%",
                  boxShadow: 3,
                  background: "#fff",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <Page
                  key={page}
                  pageNumber={page}
                  width={pageRenderWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <Box sx={{ p: 6, textAlign: "center" }}>
                      <CircularProgress />
                    </Box>
                  }
                />
              </Box>
            </Document>
          </Box>
        )}

        {renderError && objectUrl && (
          <Box sx={{ textAlign: "center", p: 3 }}>
            <Typography color="error">
              Preview failed: {String(renderError)}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => window.open(objectUrl, "_blank")}
              sx={{ mt: 2 }}
            >
              Open in new tab
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
