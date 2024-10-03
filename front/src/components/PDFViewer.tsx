// src/components/PDFViewer.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Text, Spinner, Center, Button } from '@chakra-ui/react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';

// Set the workerSrc to the public path
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface PDFViewerProps {
  fileId: number;
  fileName: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, fileName }) => {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `http://localhost:8000/api/files/${fileId}`,
          {
            responseType: 'arraybuffer',
          },
        );
        setPdfData(response.data);
      } catch (error) {
        console.error('Error fetching PDF:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPdf();
  }, [fileId]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const memoizedFile = useMemo(() => ({ data: pdfData }), [pdfData]);

  if (isLoading) {
    return (
      <Center h="100%">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!pdfData) {
    return <Text>Failed to load PDF.</Text>;
  }

  return (
    <div>
      <Document
        file={memoizedFile}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<Spinner />}
        error={<Text>Failed to load PDF.</Text>}
        noData={<Text>No PDF file specified.</Text>}
      >
        <Page pageNumber={pageNumber} />
      </Document>
      <div>
        <Button
          onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          disabled={pageNumber <= 1}
          colorScheme="blue"
          mr={2}
          mt={4}
        >
          Previous
        </Button>
        <Button
          onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
          disabled={pageNumber >= numPages}
          colorScheme="blue"
          mt={4}
        >
          Next
        </Button>
        <Text mt={4}>
          Page {pageNumber} of {numPages}
        </Text>
      </div>
    </div>
  );
};

export default PDFViewer;