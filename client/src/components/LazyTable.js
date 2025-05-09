import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow } from '@mui/material';

export default function LazyTable({ route, columns, defaultPageSize = 10, rowsPerPageOptions = [5, 10, 25] }) {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0); // 0-indexed for TablePagination
    const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize); // Use rowsPerPage

    useEffect(() => {
        fetch(`${route}&page=${page + 1}&page_size=${rowsPerPage}`) // Correct URL
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((resJson) => setData(resJson))
            .catch((error) => console.error('Fetch error:', error));
    }, [route, page, rowsPerPage]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset page to 0 when page size changes
    };

    const defaultRenderCell = (col, row) => {
        return <div>{row[col.field]}</div>;
    };

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        {columns.map((col) => (
                            <TableCell key={col.headerName}>{col.headerName}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row, idx) => (
                        <TableRow key={idx}>
                            {columns.map((col) => (
                                <TableCell key={col.headerName}>
                                    {col.renderCell ? col.renderCell(row) : defaultRenderCell(col, row)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={rowsPerPageOptions}
                component="div"
                count={-1} // Let the backend handle the total count
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </TableContainer>
    );
}