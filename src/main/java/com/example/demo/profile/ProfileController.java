package com.example.demo.profile;

import com.example.demo.user.User;
import com.example.demo.user.UserService;
import java.security.Principal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public String profile(Model model, Principal principal) {
        String username = principal.getName();
        User user = userService.findUserByUsername(username).orElseThrow();
        model.addAttribute("user", user);
        return "profile";
    }
}