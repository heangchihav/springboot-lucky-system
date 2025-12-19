package com.example.demo.auth;

import com.example.demo.user.UserService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/register")
    public String showRegisterForm(Model model) {
        model.addAttribute("userForm", new RegisterForm());
        return "register";
    }

    @PostMapping("/register")
    public String handleRegister(@ModelAttribute("userForm") RegisterForm form) {
        userService.register(form.getUsername(), form.getPassword(), form.getFullName());
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String showLogin() {
        return "login";
    }
}