package com.priyanka.payment_service.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private static final Logger logger =
            LoggerFactory.getLogger(PaymentController.class);

    @PostMapping
    public String makePayment(@RequestParam String user) {

        logger.info("Received payment request for user: {}", user);

        if (user == null || user.trim().isEmpty()) {
            logger.error("Payment failed: user name is empty");
            return "Payment failed: user cannot be empty";
        }

        logger.info("Payment processed successfully for user: {}", user);

        return "Payment successful for user: " + user;
    }

    @GetMapping("/{user}")
    public String getPayment(@PathVariable String user) {

        logger.info("Checking payment status for user: {}", user);

        if (user.equalsIgnoreCase("unknown")) {
            logger.warn("No payment record found for user: {}", user);
            return "No payment record found for: " + user;
        }

        logger.info("Payment record found for user: {}", user);

        return "Payment details for: " + user;
    }
}