package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query("SELECT p.projectId FROM Project p ORDER BY p.projectId DESC LIMIT 1")
    String findMaxProjectId();
}
