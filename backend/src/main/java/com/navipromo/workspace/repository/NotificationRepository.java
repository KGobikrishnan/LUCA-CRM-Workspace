package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // Fetch notifications for a specific user (their own + broadcast ones where userId is null)
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId OR n.userId IS NULL ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdOrBroadcast(@Param("userId") UUID userId);

    // Count unread for a user
    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.userId = :userId OR n.userId IS NULL) AND n.isRead = false")
    long countUnreadForUser(@Param("userId") UUID userId);
}
