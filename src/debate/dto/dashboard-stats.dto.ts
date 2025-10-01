import { ApiProperty } from '@nestjs/swagger';
import { ThreadStatus } from '../../database/schemas/debate-thread.schema';
import { ArgumentStatus } from '../../database/schemas/argument.schema';
import { UserStatus } from '../../database/schemas/user.schema';

export class ThreadStatusStatsDto {
    @ApiProperty({ description: 'Số lượng chủ đề chờ duyệt' })
    pending: number;

    @ApiProperty({ description: 'Số lượng chủ đề đang hoạt động' })
    active: number;

    @ApiProperty({ description: 'Số lượng chủ đề tạm dừng' })
    paused: number;

    @ApiProperty({ description: 'Số lượng chủ đề đã đóng' })
    closed: number;

    @ApiProperty({ description: 'Số lượng chủ đề đã lưu trữ' })
    archived: number;

    @ApiProperty({ description: 'Tổng số chủ đề' })
    total: number;
}

export class ArgumentStatusStatsDto {
    @ApiProperty({ description: 'Số lượng luận điểm chờ duyệt' })
    pending: number;

    @ApiProperty({ description: 'Số lượng luận điểm đã duyệt' })
    approved: number;

    @ApiProperty({ description: 'Số lượng luận điểm bị từ chối' })
    rejected: number;

    @ApiProperty({ description: 'Số lượng luận điểm bị gắn cờ' })
    flagged: number;

    @ApiProperty({ description: 'Tổng số luận điểm' })
    total: number;
}

export class UserActivityStatsDto {
    @ApiProperty({ description: 'Số lượng người dùng trực tuyến' })
    online: number;

    @ApiProperty({ description: 'Số lượng người dùng offline' })
    offline: number;

    @ApiProperty({ description: 'Số lượng người dùng đang bận' })
    busy: number;

    @ApiProperty({ description: 'Số lượng người dùng vắng mặt' })
    away: number;

    @ApiProperty({ description: 'Tổng số người dùng' })
    total: number;

    @ApiProperty({ description: 'Số lượng người dùng mới trong 7 ngày qua' })
    newUsersLast7Days: number;

    @ApiProperty({ description: 'Số lượng người dùng hoạt động trong 24 giờ qua' })
    activeUsersLast24Hours: number;
}

export class SystemOverviewStatsDto {
    @ApiProperty({ description: 'Tổng số lượt vote' })
    totalVotes: number;

    @ApiProperty({ description: 'Tổng số lượt vote ủng hộ' })
    supportVotes: number;

    @ApiProperty({ description: 'Tổng số lượt vote phản đối' })
    opposeVotes: number;

    @ApiProperty({ description: 'Tổng số lượt like luận điểm' })
    totalLikes: number;

    @ApiProperty({ description: 'Tổng số lượt dislike luận điểm' })
    totalDislikes: number;

    @ApiProperty({ description: 'Tổng số lượt reply luận điểm' })
    totalReplies: number;

    @ApiProperty({ description: 'Tổng số lượt xem luận điểm' })
    totalViews: number;
}

export class RecentActivityDto {
    @ApiProperty({ description: 'ID hoạt động' })
    id: string;

    @ApiProperty({ description: 'Loại hoạt động' })
    type: string;

    @ApiProperty({ description: 'Tiêu đề hoặc mô tả' })
    title: string;

    @ApiProperty({ description: 'Người thực hiện' })
    user: string;

    @ApiProperty({ description: 'Thời gian' })
    timestamp: Date;

    @ApiProperty({ description: 'Trạng thái' })
    status?: string;
}

export class AdminDashboardDto {
    @ApiProperty({ description: 'Thống kê trạng thái chủ đề', type: ThreadStatusStatsDto })
    threadStats: ThreadStatusStatsDto;

    @ApiProperty({ description: 'Thống kê trạng thái luận điểm', type: ArgumentStatusStatsDto })
    argumentStats: ArgumentStatusStatsDto;

    @ApiProperty({ description: 'Thống kê hoạt động người dùng', type: UserActivityStatsDto })
    userStats: UserActivityStatsDto;

    @ApiProperty({ description: 'Tổng quan hệ thống', type: SystemOverviewStatsDto })
    systemStats: SystemOverviewStatsDto;

    @ApiProperty({ description: 'Hoạt động gần đây', type: [RecentActivityDto] })
    recentActivity: RecentActivityDto[];

    @ApiProperty({ description: 'Thời gian cập nhật cuối' })
    lastUpdated: Date;
}
