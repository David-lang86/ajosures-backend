package com.ajosures.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/")
    public String home() {
        return "AJOSURES Backend Running Successfully";
    }

    @GetMapping("/api/test")
    public String test() {
        return "API Working";
    }
}
