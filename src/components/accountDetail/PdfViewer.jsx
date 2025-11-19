// components/accountDetail/PdfViewer.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Toolbar,
  Tooltip,
  Typography,
  Button,
  CircularProgress,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

import { Document, Page, pdfjs } from "react-pdf";

// your bundled worker import (you said this works)
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export default function PdfViewer({ open, onClose, pdfResult }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [page, setPage] = useState(1);
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [renderError, setRenderError] = useState(null);

  const contentRef = useRef(null);
  const pageContainerRef = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(800);

  // Create / revoke object URL for pdf blob
  useEffect(() => {
    if (pdfResult && pdfResult.blob) {
      const url = URL.createObjectURL(pdfResult.blob);
      setObjectUrl(url);
      return () => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
        setObjectUrl(null);
      };
    } else {
      setObjectUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfResult]);

  // Better width measurement using getBoundingClientRect (handles transforms/padding)
  useEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;

    const update = () => {
      try {
        const rect = el.getBoundingClientRect();
        const raw = rect.width;
        // subtract some safe padding so the page fits comfortably
        const padded = Math.max(200, raw - 48);
        setAvailableWidth(padded);
      } catch {
        setAvailableWidth(Math.max(300, window.innerWidth * 0.6));
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
  }, [contentRef, open]);

  // reset states when a new PDF loads
  useEffect(() => {
    setPage(1);
    setNumPages(null);
    setZoomMultiplier(1);
    setRenderError(null);
  }, [objectUrl]);

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
    } catch (err) {
      if (objectUrl) window.open(objectUrl, "_blank");
    }
  };

  const onDocumentLoadSuccess = ({ numPages: np }) => {
    setNumPages(np);
    setPage(1);
    setRenderError(null);
  };

  const onDocumentLoadError = (err) => {
    console.error("PDF render error:", err);
    setRenderError(err?.message || "Failed to render PDF");
  };

  const zoomIn = () => setZoomMultiplier((s) => Math.min(3, +(s + 0.2).toFixed(2)));
  const zoomOut = () => setZoomMultiplier((s) => Math.max(0.6, +(s - 0.2).toFixed(2)));
  const fitWidth = () => setZoomMultiplier(1);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(numPages || 1, p + 1));

  // Decide page render width: clamp so it never becomes tiny or absurdly huge
  const rawWidth = Math.round(availableWidth * zoomMultiplier);
  const pageRenderWidth = Math.min(Math.max(rawWidth, 420), 1200); // clamp between 420 and 1200 px

  return (
    <Dialog fullWidth maxWidth="xl" open={open} onClose={onClose}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="h6">View Statement</Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Download">
            <IconButton onClick={handleDownload} size="small" aria-label="download">
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Zoom out">
            <IconButton onClick={zoomOut} size="small" aria-label="zoom-out">
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Fit width">
            <IconButton onClick={fitWidth} size="small" aria-label="fit-width">
              <FitScreenIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Zoom in">
            <IconButton onClick={zoomIn} size="small" aria-label="zoom-in">
              <ZoomInIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Previous page">
            <IconButton onClick={goPrev} size="small" aria-label="prev-page">
              <NavigateBeforeIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Next page">
            <IconButton onClick={goNext} size="small" aria-label="next-page">
              <NavigateNextIcon />
            </IconButton>
          </Tooltip>

          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Toolbar variant="dense" sx={{ px: 2, pt: 0, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {pdfResult?.filename || ""}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
            <TextField
              size="small"
              value={page}
              onChange={(e) => {
                const v = Number(e.target.value || 1);
                if (!isNaN(v)) setPage(Math.max(1, Math.min(numPages || 1, v)));
              }}
              inputProps={{ style: { width: 56, textAlign: "center" } }}
            />
            <Typography variant="body2">/ {numPages || "-"}</Typography>
          </Box>
        </Box>
      </Toolbar>

      <DialogContent
        dividers
        sx={{
          height: { xs: "75vh", sm: "80vh" },
          p: 0,
          display: "flex",
          flexDirection: "column",
        }}
        ref={contentRef}
      >
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            background: "#f5f6f8",
            py: 2,
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
            <Document
              file={objectUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<CircularProgress />}
              error={null}
              options={{ cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`, cMapPacked: true }}
            >
              <Box
                ref={pageContainerRef}
                sx={{
                  width: pageRenderWidth,
                  boxShadow: 3,
                  background: "#fff",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <Page
                  pageNumber={page}
                  width={pageRenderWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={true}
                  loading={<Box sx={{ p: 6, textAlign: "center" }}><CircularProgress /></Box>}
                />
              </Box>
            </Document>
          )}

          {renderError && (
            <Box sx={{ textAlign: "center", p: 3 }}>
              <Typography color="error">Preview failed: {String(renderError)}</Typography>
              <Button variant="outlined" onClick={() => window.open(objectUrl, "_blank")} sx={{ mt: 2 }}>
                Open in new tab
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
