import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDownIcon, MoreDotIcon } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { getUserRole, getUserData } from "../utils/auth";
import { useTranslation } from "react-i18next";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles: string[];
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <img src="/icons/map.svg" alt="map" className="w-7 h-7 dark:filter dark:brightness-0 dark:invert dark:opacity-90" />,
    name: "sidebar.map",
    roles: ["user", "admin", "officer"],
    path: "/user/map",
  },
  {
    icon: <img src="/icons/report.svg" alt="report" className="w-7 h-7 dark:filter dark:brightness-0 dark:invert dark:opacity-90" />,
    name: "sidebar.dataReport",
    roles: ["user", "admin", "officer"],
    path: "/report",
  },
  {
    icon: <img src="/icons/admin.svg" alt="admin" className="w-7 h-7 dark:filter dark:brightness-0 dark:invert dark:opacity-90" />,
    name: "sidebar.admin.title",
    roles: ["admin"],
    subItems: [
      { name: "sidebar.admin.inputData", path: "/admin/datainput", pro: false },
      { name: "sidebar.admin.dataUser", path: "/admin/datauser", pro: false },
      { name: "sidebar.admin.dataTree", path: "/admin/datatree", pro: false },
      { name: "sidebar.admin.dataRoad", path: "/admin/dataroad", pro: false },
      // { name: "sidebar.admin.dataReport", path: "/admin/datareport", pro: false },
    ],
  },
  {
    icon: <img src="/icons/officer.svg" alt="officer" className="w-7 h-7 dark:filter dark:brightness-0 dark:invert dark:opacity-90" />,
    name: "sidebar.officerDashboard",
    roles: ["officer"],
    path: "/officer/dashboard",
  },
  {
    icon: <img src="/icons/user.svg" alt="user" className="w-7 h-7 dark:filter dark:brightness-0 dark:invert dark:opacity-90" />,
    name: "sidebar.user.title",
    roles: ["user", "admin", "officer"],
    // subItems will be constructed at render time so we can include the dynamic user id
    subItems: [],
  },
  // DataReport sidebar item removed
];

const AppSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    // Hanya buka submenu jika path cocok, tapi jangan tutup submenu jika tidak cocok
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
          }
        });
      }
    });
    // Jangan setOpenSubmenu(null) di sini, biarkan user menutup manual
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => {
    const userRole = getUserRole();
    // create a shallow copy of items to inject dynamic subItems for the User menu
    const itemsWithDynamic = items.map((it) => ({ ...it }));
    const user = getUserData();
    const userId = user?.id;
    // find the User nav item and set its subItems to include My Profile first
    // note: nav item names are translation keys now
      const userNavIndex = itemsWithDynamic.findIndex((i) => i.name === "sidebar.user.title");
      if (userNavIndex !== -1) {
        itemsWithDynamic[userNavIndex].subItems = [
          { name: "sidebar.user.myProfile", path: userId ? `/view/profile/${userId}` : "/view/profile/", pro: false },
          { name: "sidebar.user.edit.profile", path: "/user/editprofile", pro: false },
          { name: "sidebar.user.example", path: "/user/example", pro: false },
        ];
      }

    return (
      <ul className="flex flex-col gap-4">
        {itemsWithDynamic
          .filter((item) => userRole && item.roles.includes(userRole))
          .map((nav, index) => (
            <li key={nav.name}>
              {nav.subItems ? (
                <button
                  onClick={() => handleSubmenuToggle(index, menuType)}
                  className={`menu-item group ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  } cursor-pointer ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "lg:justify-start"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size  ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{t(nav.name)}</span>
                  )}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        openSubmenu?.type === menuType &&
                        openSubmenu?.index === index
                          ? "rotate-180 text-brand-500"
                          : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                nav.path && (
                  <Link
                    to={nav.path}
                    className={`menu-item group ${
                      isActive(nav.path)
                        ? "menu-item-active"
                        : "menu-item-inactive"
                    }`}
                  >
                    <span
                      className={`menu-item-icon-size ${
                        isActive(nav.path)
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {nav.icon}
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">{t(nav.name)}</span>
                    )}
                  </Link>
                )
              )}
              {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[`${menuType}-${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height:
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? `${subMenuHeight[`${menuType}-${index}`]}px`
                        : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                          onClick={() => {
                            if (isMobileOpen) toggleMobileSidebar();
                          }}
                        >
                          {t(subItem.name)}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
      </ul>
    );
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-[99999] border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.png"
                alt="Logo"
                width={200}
                height={50}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.png"
                alt="Logo"
                width={200}
                height={50}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
                  <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("sidebar.menu")
                ) : (
                  <MoreDotIcon className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
