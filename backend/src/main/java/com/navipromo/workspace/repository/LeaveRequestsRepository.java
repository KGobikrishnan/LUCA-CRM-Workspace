package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.LeaveRequests;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface LeaveRequestsRepository extends JpaRepository<LeaveRequests, UUID> {
}
