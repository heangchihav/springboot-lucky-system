package com.example.demo.web;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@ConditionalOnProperty(name = "app.spa.enabled", havingValue = "true")
public class SpaForwardingController {

    @RequestMapping(value = {"/{path:^(?!api$|api/|actuator$|actuator/)[^\\.]*}$", "/**/{path:^(?!api$|api/|actuator$|actuator/)[^\\.]*}$"}, method = RequestMethod.GET)
    public String forward() {
        return "forward:/index.html";
    }
}
