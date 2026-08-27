package com.prathibhashree.distributed_log_analytics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.prathibhashree.distributed_log_analytics_system.entity.Log;

public interface LogRepository extends JpaRepository<Log, Long> {

    long countByLevel(String level);

    long countByServiceName(String serviceName);
}