# Grouped Goods Shipment API Documentation

## Overview
The goods shipment API now supports grouped responses where shipments are grouped by member instead of returning individual shipment records.

## New Endpoints

### GET /api/marketing/goods-shipments/grouped
Returns goods shipments grouped by member, eliminating duplicate member data.

#### Parameters
- `memberId` (optional): Filter by specific member ID
- `branchId` (optional): Filter by branch ID
- `subAreaId` (optional): Filter by sub-area ID  
- `areaId` (optional): Filter by area ID
- `myOnly` (default: true): Filter to show only user's created records
- `memberQuery` (optional): Search by member name or phone
- `limit` (optional): Maximum number of members to return (non-paginated)
- `page` (optional): Page number for paginated results
- `size` (optional): Page size for paginated results
- `startDate` (optional): Filter by shipment start date
- `endDate` (optional): Filter by shipment end date

#### Response Structure (Non-paginated)
```json
[
  {
    "memberId": 1,
    "memberName": "John Doe",
    "memberPhone": "0123456789",
    "branchId": 76,
    "branchName": "Main Branch",
    "records": [
      {
        "sendDate": "2026-02-04",
        "totalGoods": 48
      },
      {
        "sendDate": "2026-02-05",
        "totalGoods": 40
      }
    ]
  }
]
```

#### Response Structure (Paginated)
```json
{
  "data": [
    {
      "memberId": 1,
      "memberName": "John Doe",
      "memberPhone": "0123456789",
      "branchId": 76,
      "branchName": "Main Branch",
      "records": [
        {
          "sendDate": "2026-02-04",
          "totalGoods": 48
        }
      ]
    }
  ],
  "totalCount": 150,
  "currentPage": 1,
  "pageSize": 10,
  "totalPages": 15,
  "hasNext": true,
  "hasPrevious": false
}
```

## Benefits
1. **Eliminates duplicate member data** - Each member appears only once in the response
2. **Reduces response size** - Member information is not repeated for each shipment
3. **Better frontend performance** - Easier to display and manage member-centric views
4. **Maintains all existing functionality** - All filters and pagination options work the same

## Usage Examples

### Get all grouped shipments for current user
```bash
GET /api/marketing/goods-shipments/grouped
```

### Get paginated grouped shipments
```bash
GET /api/marketing/goods-shipments/grouped?page=1&size=20
```

### Filter by branch and date range
```bash
GET /api/marketing/goods-shipments/grouped?branchId=76&startDate=2026-02-01&endDate=2026-02-28
```

### Search by member name
```bash
GET /api/marketing/goods-shipments/grouped?memberQuery=John
```

## Migration Notes
- The original `/api/marketing/goods-shipments` endpoint remains unchanged for backward compatibility
- Use the new `/grouped` endpoint when you need member-centric data
- Frontend applications should update to use the grouped endpoint for better performance
