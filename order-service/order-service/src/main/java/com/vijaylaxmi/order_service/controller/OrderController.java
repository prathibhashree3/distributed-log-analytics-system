package com.vijaylaxmi.order_service.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private static final Logger logger =
            LoggerFactory.getLogger(OrderController.class);

    private final RestClient restClient;

    @Value("${user.service.url}")
    private String userServiceUrl;

    @Value("${payment.service.url}")
    private String paymentServiceUrl;

    @Value("${inventory.service.url}")
    private String inventoryServiceUrl;

    public OrderController() {
        this.restClient = RestClient.create();
    }

    @PostMapping
    public String createOrder(
            @RequestParam String product,
            @RequestParam String user) {

        logger.info("Received order request for product: {} from user: {}",
                product, user);

        try {

            // 1. Verify User
            String userResponse = restClient.get()
                    .uri(userServiceUrl + "/users/" + user)
                    .retrieve()
                    .body(String.class);

            logger.info("User Service response: {}", userResponse);

            if (userResponse.contains("User not found")) {
                logger.warn("Order rejected because user was not found: {}", user);
                return "Order failed: user not found - " + user;
            }

            logger.info("User verified successfully: {}", user);

            // 2. Check Inventory
            String inventoryResponse = restClient.get()
                    .uri(inventoryServiceUrl + "/inventory/" + product)
                    .retrieve()
                    .body(String.class);

            logger.info("Inventory Service response: {}", inventoryResponse);

            if (inventoryResponse.contains("Product not found")) {
                logger.warn("Order rejected because product is not available: {}", product);
                return "Order failed: product not available - " + product;
            }

            logger.info("Product is available in inventory: {}", product);

            // 3. Process Payment
            String paymentResponse = restClient.post()
                    .uri(paymentServiceUrl + "/payments?user=" + user)
                    .retrieve()
                    .body(String.class);

            logger.info("Payment Service response: {}", paymentResponse);

            if (paymentResponse.contains("Payment failed")) {
                logger.error("Order failed because payment failed for user: {}", user);
                return "Order failed: payment unsuccessful";
            }

            logger.info("Payment successful for user: {}", user);

            // 4. Create Order
            logger.info(
                    "Order created successfully for product: {} by user: {}",
                    product, user);

            return "Order created successfully for: "
                    + product + " by user: " + user;

        } catch (Exception e) {

            logger.error("Order processing failed: {}", e.getMessage());

            return "Order failed: " + e.getMessage();
        }
    }

    @GetMapping("/{product}")
    public String getOrder(@PathVariable String product) {

        logger.info("Searching for order: {}", product);

        if (product.equalsIgnoreCase("unknown")) {
            logger.warn("Order not found for product: {}", product);
            return "Order not found: " + product;
        }

        logger.info("Order found successfully for product: {}", product);

        return "Order details for: " + product;
    }
}