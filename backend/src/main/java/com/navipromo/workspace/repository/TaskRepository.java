package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    @Query("SELECT t.taskId FROM Task t ORDER BY t.taskId DESC LIMIT 1")
    String findMaxTaskId();
}
