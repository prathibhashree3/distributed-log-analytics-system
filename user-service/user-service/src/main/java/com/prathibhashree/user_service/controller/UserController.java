package com.prathibhashree.user_service.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {

    private static final Logger logger =
            LoggerFactory.getLogger(UserController.class);

    @PostMapping
    public String createUser(@RequestParam String name) {

        logger.info("Received request to create user: {}", name);

        if (name == null || name.trim().isEmpty()) {
            logger.error("User creation failed: user name is empty");
            return "User creation failed: name cannot be empty";
        }

        logger.info("User created successfully: {}", name);

        return "User created successfully: " + name;
    }

    @GetMapping("/{name}")
    public String getUser(@PathVariable String name) {

        logger.info("Searching for user: {}", name);

        if (name.equalsIgnoreCase("unknown")) {
            logger.warn("User not found: {}", name);
            return "User not found: " + name;
        }

        logger.info("User found successfully: {}", name);

        return "User details for: " + name;
    }
}