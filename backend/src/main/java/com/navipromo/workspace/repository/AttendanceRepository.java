package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
}
