package com.prathibhashree.distributed_log_analytics_system.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prathibhashree.distributed_log_analytics_system.entity.Log;
import com.prathibhashree.distributed_log_analytics_system.service.LogService;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    @PostMapping
    public Log createLog(@RequestBody Log log) {
        return logService.saveLog(log);
    }

    @GetMapping
    public List<Log> getAllLogs() {
        return logService.getAllLogs();
    }

    @GetMapping("/health")
    public String health() {
        return "Log Analytics API is working!";
    }
    @GetMapping("/analytics/level/{level}")
public long countByLevel(@PathVariable String level) {
    return logService.countByLevel(level);
}

    @GetMapping("/analytics/service/{serviceName}")
public long countByServiceName(@PathVariable String serviceName) {
    return logService.countByServiceName(serviceName);
}
}