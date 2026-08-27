package com.prathibhashree.distributed_log_analytics_system.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.prathibhashree.distributed_log_analytics_system.entity.Log;
import com.prathibhashree.distributed_log_analytics_system.repository.LogRepository;

@Service
public class LogService {

    private final LogRepository logRepository;

    public LogService(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    public Log saveLog(Log log) {
        return logRepository.save(log);
    }

    public List<Log> getAllLogs() {
        return logRepository.findAll();
    }

    public long countByLevel(String level) {
        return logRepository.countByLevel(level);
    }

    public long countByServiceName(String serviceName) {
        return logRepository.countByServiceName(serviceName);
    }
}